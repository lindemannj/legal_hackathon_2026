"""Load and validate the shared seed, then upsert the milestone-one data."""

import json
from pathlib import Path
from typing import Literal
from uuid import uuid4

from argon2 import PasswordHasher
from pydantic import BaseModel, Field, model_validator

from .config import Settings
from .db import connect, init_db


class Partei(BaseModel):
    name: str = Field(min_length=1)
    art: Literal["natuerlich", "juristisch"]
    anschrift: str | None = None
    vertretenDurch: str | None = None


class Gericht(BaseModel):
    id: str = Field(min_length=1)
    art: Literal["AG", "LG"]
    name: str = Field(min_length=1)
    bezirk: str = Field(min_length=1)


class Einheit(BaseModel):
    id: str = Field(min_length=1)
    gerichtId: str
    bezeichnung: str
    zustaendigkeit: str = ""


class Benutzer(BaseModel):
    id: str = Field(min_length=1)
    kennung: str = Field(min_length=1)
    name: str = Field(min_length=1)
    amtsbezeichnung: str = Field(min_length=1)
    rolle: Literal["richter", "geschaeftsstelle", "admin"]
    einheitIds: list[str] = Field(min_length=1)
    demoKonto: bool = False


class Bedingung(BaseModel):
    sachgebiet: Literal["allgemein", "wohnraummiete", "nachbarrecht", "heilbehandlung", "veroeffentlichung", "vergabe"]
    beklagteAnfangsbuchstaben: str | None = Field(default=None, pattern=r"^[A-Z]-[A-Z]$")


class GvpRegel(BaseModel):
    id: str
    gerichtId: str
    einheitId: str
    regelText: str
    bedingung: Bedingung


class Merkmal(BaseModel):
    id: str = Field(pattern=r"^m-\d{3}$")
    nr: int = Field(gt=0)
    kategorie: Literal["A", "B", "C", "D", "E", "F", "G"]
    titel: str
    norm: str
    quelle: Literal["regel", "ki", "manuell"]
    beschreibung: str = ""
    gerichte: list[Literal["AG", "LG"]] = Field(min_length=1)
    platzhalter: bool
    aktiv: bool


class RegisterEintrag(BaseModel):
    az: str
    gerichtId: str
    parteien: str
    status: str
    zugestelltAm: str | None = None


class Dokument(BaseModel):
    id: str
    typ: Literal["klageschrift", "anlage"]
    name: str
    seiten: int = Field(ge=0)
    text: str | None = None


class Eingang(BaseModel):
    eingangAm: str
    uebermittlungsweg: str
    kostenvorschuss: Literal["bezahlt", "offen"]
    xjustizXml: str
    dokumente: list[Dokument]

    @model_validator(mode="after")
    def has_klageschrift(self):
        if not any(d.typ == "klageschrift" and d.text for d in self.dokumente):
            raise ValueError("Klageschrift mit text fehlt")
        return self


class Extraktion(BaseModel):
    klaeger: list[Partei] = Field(min_length=1)
    beklagte: list[Partei] = Field(min_length=1)
    sachgebiet: Literal["allgemein", "wohnraummiete", "nachbarrecht", "heilbehandlung", "veroeffentlichung", "vergabe"]
    streitwertCent: int = Field(ge=0)
    streitwertXJustizCent: int | None = Field(default=None, ge=0)
    gegenstand: str | None = None
    prozessbevollmaechtigter: str | None = None


class Zuweisung(BaseModel):
    einheitId: str
    richterId: str
    regelId: str


class Fundstelle(BaseModel):
    dokumentId: str
    zitat: str


class Ergebnis(BaseModel):
    merkmalId: str
    status: Literal["erfuellt", "mangel", "pruefen", "offen", "keine_anhaltspunkte", "nicht_anwendbar"]
    relevanz: Literal["hoch", "mittel", "niedrig"] | None = None
    text: str
    grundlage: str | None = None
    fundstellen: list[Fundstelle] = Field(default_factory=list)
    verweisAz: str | None = None


class Auswertung(BaseModel):
    geprueftAm: str
    ergebnisse: list[Ergebnis]


class Erwartet(BaseModel):
    extraktion: Extraktion
    xjustizFelder: dict[str, str]
    xjustizAbweichungen: list[str] = Field(default_factory=list)
    zuweisung: Zuweisung
    auswertung: Auswertung
    formulierungsvorschlag: str


class Fall(BaseModel):
    id: str
    gerichtId: str
    vorlaeufigesAz: str
    nurSimulation: bool = False
    eingang: Eingang
    erwartet: Erwartet


class Meta(BaseModel):
    regelwerkVersion: str
    modellVersion: str


class Seed(BaseModel):
    schemaVersion: Literal[1]
    meta: Meta
    gerichte: list[Gericht]
    einheiten: list[Einheit]
    benutzer: list[Benutzer]
    gvpRegeln: list[GvpRegel]
    merkmale: list[Merkmal]
    verfahrensregister: list[RegisterEintrag]
    faelle: list[Fall]

    @model_validator(mode="after")
    def check_references(self):
        gerichte = {g.id for g in self.gerichte}
        einheiten = {e.id for e in self.einheiten}
        benutzer = {b.id for b in self.benutzer}
        regeln = {r.id for r in self.gvpRegeln}
        merkmale = {m.id for m in self.merkmale}
        for e in self.einheiten:
            if e.gerichtId not in gerichte:
                raise ValueError(f"Einheit {e.id}: unbekanntes Gericht {e.gerichtId}")
        for b in self.benutzer:
            if not set(b.einheitIds) <= einheiten:
                raise ValueError(f"Benutzer {b.id}: unbekannte Einheit")
        for r in self.gvpRegeln:
            if r.gerichtId not in gerichte or r.einheitId not in einheiten:
                raise ValueError(f"GVP-Regel {r.id}: unbekanntes Gericht oder Einheit")
        for v in self.verfahrensregister:
            if v.gerichtId not in gerichte:
                raise ValueError(f"Register {v.az}: unbekanntes Gericht")
        for f in self.faelle:
            z = f.erwartet.zuweisung
            if f.gerichtId not in gerichte or z.einheitId not in einheiten or z.richterId not in benutzer or z.regelId not in regeln:
                raise ValueError(f"Fall {f.id}: unbekannte Zuweisung")
            dokumente = {d.id for d in f.eingang.dokumente}
            for ergebnis in f.erwartet.auswertung.ergebnisse:
                if ergebnis.merkmalId not in merkmale or not {x.dokumentId for x in ergebnis.fundstellen} <= dokumente:
                    raise ValueError(f"Fall {f.id}: unbekanntes Merkmal oder Dokument")
        return self


def load_seed(path: Path) -> Seed:
    return Seed.model_validate_json(path.read_text(encoding="utf-8"))


def _upsert(db, table: str, values: dict, conflict: str, update: tuple[str, ...]) -> None:
    columns = ", ".join(f'"{key}"' for key in values)
    placeholders = ", ".join("?" for _ in values)
    assignments = ", ".join(f'"{key}" = excluded."{key}"' for key in update)
    db.execute(
        f'INSERT INTO "{table}" ({columns}) VALUES ({placeholders}) '
        f'ON CONFLICT ({conflict}) DO UPDATE SET {assignments}',
        tuple(values.values()),
    )


def seed_database(config: Settings) -> Seed:
    seed = load_seed(config.seed_path)
    init_db(config.database_path)
    password_hash = PasswordHasher().hash(config.demo_passwort)
    with connect(config.database_path) as db:
        for g in seed.gerichte:
            values = g.model_dump()
            _upsert(db, "Gericht", values, '"id"', ("art", "name", "bezirk"))
        for e in seed.einheiten:
            values = e.model_dump()
            _upsert(db, "Einheit", values, '"id"', ("gerichtId", "bezeichnung", "zustaendigkeit"))
        for b in seed.benutzer:
            values = {k: v for k, v in b.model_dump().items() if k != "einheitIds"}
            values["demoKonto"] = int(b.demoKonto)
            values["passwortHash"] = password_hash
            _upsert(db, "Benutzer", values, '"id"', tuple(k for k in values if k != "id"))
            db.execute('DELETE FROM "BenutzerEinheit" WHERE "benutzerId" = ?', (b.id,))
            db.executemany(
                'INSERT INTO "BenutzerEinheit" ("benutzerId", "einheitId") VALUES (?, ?)',
                [(b.id, unit_id) for unit_id in b.einheitIds],
            )
        for r in seed.gvpRegeln:
            values = {k: v for k, v in r.model_dump().items() if k != "bedingung"}
            values["bedingung"] = r.bedingung.model_dump_json(exclude_none=True)
            _upsert(db, "GvpRegel", values, '"id"', ("gerichtId", "einheitId", "regelText", "bedingung"))
        for m in seed.merkmale:
            values = m.model_dump()
            values["gerichte"] = json.dumps(m.gerichte)
            values["platzhalter"] = int(m.platzhalter)
            values["aktiv"] = int(m.aktiv)
            _upsert(db, "Merkmal", values, '"id"', tuple(k for k in values if k != "id"))
        for v in seed.verfahrensregister:
            values = v.model_dump()
            _upsert(db, "Verfahrensregister", values, '"az"', ("gerichtId", "parteien", "status", "zugestelltAm"))
        for f in seed.faelle:
            if f.nurSimulation:
                continue
            extraction = f.erwartet.extraktion.model_dump(exclude_none=True)
            extraction["xjustizFelder"] = f.erwartet.xjustizFelder
            extraction["xjustizAbweichungen"] = f.erwartet.xjustizAbweichungen
            values = {
                "id": f.id, "gerichtId": f.gerichtId,
                "einheitId": f.erwartet.zuweisung.einheitId,
                "richterId": f.erwartet.zuweisung.richterId,
                "regelId": f.erwartet.zuweisung.regelId,
                "vorlaeufigesAz": f.vorlaeufigesAz,
                "eingangAm": f.eingang.eingangAm,
                "uebermittlungsweg": f.eingang.uebermittlungsweg,
                "kostenvorschuss": f.eingang.kostenvorschuss,
                "nurSimulation": 0,
                "xjustizXml": f.eingang.xjustizXml,
                "extraktion": json.dumps(extraction, ensure_ascii=False),
                "auswertungStatus": "abgeschlossen",
                "ausgewertetAm": f.erwartet.auswertung.geprueftAm,
                "regelwerkVersion": seed.meta.regelwerkVersion,
                "modellVersion": seed.meta.modellVersion,
            }
            update = tuple(k for k in values if k not in {"id", "gerichtId", "vorlaeufigesAz", "nurSimulation"})
            _upsert(db, "Fall", values, '"id"', update)
            for d in f.eingang.dokumente:
                values = {"id": d.id, "fallId": f.id, **d.model_dump(exclude={"id"})}
                _upsert(db, "Dokument", values, '"id"', ("typ", "name", "seiten", "text"))
            for e in f.erwartet.auswertung.ergebnisse:
                values = {
                    "id": uuid4().hex, "fallId": f.id, "merkmalId": e.merkmalId,
                    "status": e.status, "relevanz": e.relevanz, "text": e.text,
                    "grundlage": e.grundlage,
                    "fundstellen": json.dumps([x.model_dump() for x in e.fundstellen], ensure_ascii=False),
                }
                _upsert(db, "Ergebnis", values, '"fallId", "merkmalId"', ("status", "relevanz", "text", "grundlage", "fundstellen"))
    return seed


def reset_database(config: Settings) -> Seed:
    init_db(config.database_path)
    with connect(config.database_path) as db:
        for table in ("VerlaufEintrag", "Entscheidung", "Ergebnis", "Dokument", "Fall", "GvpRegel", "TurnusZaehler", "Verfahrensregister", "Merkmal", "BenutzerEinheit", "Benutzer", "Einheit", "Gericht", "LlmAufruf"):
            exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
            if exists:
                db.execute(f'DELETE FROM "{table}"')
    return seed_database(config)
