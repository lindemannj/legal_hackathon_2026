"""FastAPI implementation of the existing milestone-one HTTP API."""

import json
import sqlite3
from contextlib import asynccontextmanager
from typing import Annotated

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, settings
from .db import connect, init_db
from .seed import seed_database


bearer = HTTPBearer(auto_error=False)


def _user(db: sqlite3.Connection, user_id: str):
    return db.execute('SELECT * FROM "Benutzer" WHERE "id" = ?', (user_id,)).fetchone()


def _as_user(db: sqlite3.Connection, user: sqlite3.Row) -> dict:
    units = db.execute(
        'SELECT e."id", e."bezeichnung", g."id" AS "gerichtId", g."name" AS "gericht" '
        'FROM "BenutzerEinheit" be JOIN "Einheit" e ON e."id" = be."einheitId" '
        'JOIN "Gericht" g ON g."id" = e."gerichtId" '
        'WHERE be."benutzerId" = ? ORDER BY be.rowid',
        (user["id"],),
    ).fetchall()
    first = units[0] if units else None
    return {
        "id": user["id"], "kennung": user["kennung"], "name": user["name"],
        "amtsbezeichnung": user["amtsbezeichnung"],
        "gerichtId": first["gerichtId"] if first else "",
        "gericht": first["gericht"] if first else "",
        "einheiten": [{"id": x["id"], "bezeichnung": x["bezeichnung"]} for x in units],
    }


def _as_case(db: sqlite3.Connection, case: sqlite3.Row) -> dict:
    extraction = json.loads(case["extraktion"] or "{}")
    documents = db.execute('SELECT * FROM "Dokument" WHERE "fallId" = ? ORDER BY rowid', (case["id"],)).fetchall()
    results = db.execute('SELECT * FROM "Ergebnis" WHERE "fallId" = ? ORDER BY rowid', (case["id"],)).fetchall()
    complaint = next((d for d in documents if d["typ"] == "klageschrift"), None)
    claimants = extraction.get("klaeger", [])
    defendants = extraction.get("beklagte", [])
    findings = {}
    for result in results:
        locations = json.loads(result["fundstellen"])
        finding = {"status": result["status"], "begruendung": result["text"]}
        if result["relevanz"] is not None:
            finding["relevanz"] = result["relevanz"]
        if result["grundlage"] is not None:
            finding["grundlage"] = result["grundlage"]
        if locations:
            finding["fundstelle"] = locations[0]["zitat"]
            finding["dokumentId"] = locations[0]["dokumentId"]
        findings[result["merkmalId"]] = finding
    output = {
        "id": case["id"], "aktenzeichen": case["vorlaeufigesAz"],
        "gerichtId": case["gerichtId"], "gericht": case["gericht"],
        "gerichtstyp": case["gerichtstyp"], "einheitId": case["einheitId"],
        "einheit": case["einheit"], "richterId": case["richterId"],
        "richter": case["richter"], "regelId": case["regelId"] or "",
        "regelText": case["regelText"] or "",
        "klaeger": ", ".join(p["name"] for p in claimants),
        "beklagte": ", ".join(p["name"] for p in defendants),
        "klaegerParteien": claimants, "beklagteParteien": defendants,
        "sachgebiet": extraction.get("sachgebiet"),
        "streitwert": extraction["streitwertCent"] / 100,
        "eingang": case["eingangAm"], "uebermittlungsweg": case["uebermittlungsweg"],
        "kostenvorschuss": case["kostenvorschuss"],
        "geprueftAm": case["ausgewertetAm"] or "",
        "klageschriftId": complaint["id"] if complaint else "",
        "klageschrift": complaint["text"] or "" if complaint else "",
        "anlagen": [
            {"id": d["id"], "bezeichnung": parts[0], "titel": " ".join(parts[1:]), "seiten": d["seiten"]}
            for d in documents if d["typ"] == "anlage"
            for parts in [d["name"].split(" ")]
        ],
        "xjustiz": [
            {"label": label, "wert": value, "abweichung": label in extraction.get("xjustizAbweichungen", [])}
            for label, value in extraction.get("xjustizFelder", {}).items()
        ],
        "xml": case["xjustizXml"], "befunde": findings,
        "anzahlAusgewertet": len(results),
        "anzahlHinweise": sum(r["status"] in {"mangel", "pruefen", "offen"} for r in results),
        "nurSimulation": bool(case["nurSimulation"]),
    }
    if extraction.get("streitwertXJustizCent") is not None:
        output["streitwertXJustiz"] = extraction["streitwertXJustizCent"] / 100
    return output


CASE_SELECT = (
    'SELECT f.*, g."name" AS "gericht", g."art" AS "gerichtstyp", '
    'e."bezeichnung" AS "einheit", b."name" AS "richter", '
    'r."regelText" AS "regelText" FROM "Fall" f '
    'JOIN "Gericht" g ON g."id" = f."gerichtId" '
    'JOIN "Einheit" e ON e."id" = f."einheitId" '
    'JOIN "Benutzer" b ON b."id" = f."richterId" '
    'LEFT JOIN "GvpRegel" r ON r."id" = f."regelId"'
)


def create_app(config: Settings | None = None) -> FastAPI:
    config = config or settings()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        if config.seed_on_start:
            seed_database(config)
        else:
            init_db(config.database_path)
        yield

    app = FastAPI(title="Klaris API", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=[config.frontend_origin], allow_methods=["*"], allow_headers=["*"])

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException):
        return JSONResponse(status_code=error.status_code, content={"message": error.detail})

    def authenticated_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> str:
        if credentials is None:
            raise HTTPException(401, detail="Nicht angemeldet")
        try:
            payload = jwt.decode(credentials.credentials, config.jwt_secret, algorithms=["HS256"])
            user_id = payload["sub"]
            if not isinstance(user_id, str):
                raise ValueError("invalid subject")
            return user_id
        except (jwt.PyJWTError, KeyError, ValueError):
            raise HTTPException(401, detail="Nicht angemeldet") from None

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/auth/login")
    async def login(request: Request):
        try:
            body = await request.json()
        except ValueError:
            raise HTTPException(400, detail="Ungültige Anfrage") from None
        if not isinstance(body, dict) or not isinstance(body.get("kennung"), str) or not body["kennung"] or not isinstance(body.get("passwort"), str):
            raise HTTPException(400, detail="Ungültige Anfrage")
        name = body["kennung"].strip().lower()
        with connect(config.database_path) as db:
            users = db.execute('SELECT * FROM "Benutzer"').fetchall()
            user = next((u for u in users if u["kennung"].lower() == name or u["id"] == name), None)
            if user is None:
                raise HTTPException(401, detail="Unbekannte Kennung")
            if not config.demo_mode:
                try:
                    PasswordHasher().verify(user["passwortHash"], body["passwort"])
                except (VerifyMismatchError, ValueError):
                    raise HTTPException(401, detail="Falsches Passwort") from None
            token = jwt.encode({"sub": user["id"]}, config.jwt_secret, algorithm="HS256")
            return {**_as_user(db, user), "token": token}

    @app.get("/auth/demo-konten")
    def demo_accounts():
        with connect(config.database_path) as db:
            users = db.execute('SELECT * FROM "Benutzer" WHERE "demoKonto" = 1 ORDER BY rowid').fetchall()
            return [_as_user(db, user) for user in users]

    @app.get("/me")
    def me(user_id: Annotated[str, Depends(authenticated_user)]):
        with connect(config.database_path) as db:
            user = _user(db, user_id)
            if user is None:
                raise HTTPException(401, detail="Nicht angemeldet")
            return _as_user(db, user)

    @app.get("/faelle")
    def cases(user_id: Annotated[str, Depends(authenticated_user)]):
        with connect(config.database_path) as db:
            rows = db.execute(
                CASE_SELECT + ' JOIN "BenutzerEinheit" be ON be."einheitId" = f."einheitId" '
                'WHERE be."benutzerId" = ? ORDER BY f.rowid',
                (user_id,),
            ).fetchall()
            return [_as_case(db, case) for case in rows]

    @app.get("/faelle/{case_id}")
    def case_detail(case_id: str, user_id: Annotated[str, Depends(authenticated_user)]):
        with connect(config.database_path) as db:
            case = db.execute(CASE_SELECT + ' WHERE f."id" = ?', (case_id,)).fetchone()
            if case is None:
                raise HTTPException(404, detail="Fall nicht gefunden")
            access = db.execute(
                'SELECT 1 FROM "BenutzerEinheit" WHERE "benutzerId" = ? AND "einheitId" = ?',
                (user_id, case["einheitId"]),
            ).fetchone()
            if access is None:
                raise HTTPException(403, detail="Kein Zugriff auf diesen Fall")
            return _as_case(db, case)

    return app


app = create_app()
