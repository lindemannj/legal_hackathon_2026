"""Behavioral checks for the API and repeatable seed import."""

import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

os.environ.setdefault("DEMO_PASSWORT", "test-password")
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-hs256")

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402
from app.seed import seed_database  # noqa: E402


SEED_PATH = Path(__file__).resolve().parents[2] / "seed" / "demo-daten.txt"


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.config = Settings(
            port=3001,
            frontend_origin="http://localhost:8080",
            database_path=Path(self.directory.name) / "dev.db",
            seed_path=SEED_PATH,
            seed_on_start=True,
            demo_mode=True,
            demo_passwort="test-password",
            jwt_secret="test-secret-that-is-long-enough-for-hs256",
        )
        self.client = TestClient(create_app(self.config))
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.directory.cleanup()

    def login(self, user):
        response = self.client.post("/auth/login", json={"kennung": user["kennung"], "passwort": "anything"})
        self.assertEqual(response.status_code, 200)
        return {"Authorization": f"Bearer {response.json()['token']}"}

    def test_login_auth_and_unit_access(self):
        seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})
        self.assertEqual(self.client.get("/faelle").status_code, 401)
        self.assertEqual(self.client.post("/auth/login", json={"kennung": "unknown", "passwort": ""}).status_code, 401)
        demo_users = self.client.get("/auth/demo-konten").json()
        self.assertEqual(len(demo_users), sum(u.get("demoKonto", False) for u in seed["benutzer"]))
        user = demo_users[0]
        headers = self.login(user)
        self.assertEqual(self.client.get("/me", headers=headers).json()["id"], user["id"])
        cases = self.client.get("/faelle", headers=headers).json()
        allowed = {unit["id"] for unit in user["einheiten"]}
        self.assertTrue(cases)
        self.assertTrue(all(case["einheitId"] in allowed for case in cases))
        self.assertTrue(all(not case["nurSimulation"] for case in cases))
        self.assertEqual(self.client.get(f"/faelle/{cases[0]['id']}", headers=headers).json(), cases[0])
        other = next(f for f in seed["faelle"] if not f.get("nurSimulation") and f["erwartet"]["zuweisung"]["einheitId"] not in allowed)
        self.assertEqual(self.client.get(f"/faelle/{other['id']}", headers=headers).status_code, 403)
        self.assertEqual(self.client.get("/faelle/missing", headers=headers).status_code, 404)

    def test_seed_upsert_keeps_runtime_fields(self):
        seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
        case_id = next(f["id"] for f in seed["faelle"] if not f.get("nurSimulation"))
        with sqlite3.connect(self.config.database_path) as db:
            db.execute('UPDATE "Fall" SET "version" = 3, "bearbeitungsstatus" = ? WHERE "id" = ?', ("beanstandet", case_id))
        seed_database(self.config)
        with sqlite3.connect(self.config.database_path) as db:
            row = db.execute('SELECT "version", "bearbeitungsstatus" FROM "Fall" WHERE "id" = ?', (case_id,)).fetchone()
            count = db.execute('SELECT count(*) FROM "Fall"').fetchone()[0]
        self.assertEqual(row, (3, "beanstandet"))
        self.assertEqual(count, sum(not f.get("nurSimulation") for f in seed["faelle"]))

    def test_password_checked_when_demo_mode_disabled(self):
        strict_config = Settings(**{**self.config.__dict__, "demo_mode": False})
        with TestClient(create_app(strict_config)) as client:
            user = client.get("/auth/demo-konten").json()[0]
            self.assertEqual(client.post("/auth/login", json={"kennung": user["kennung"], "passwort": "wrong"}).status_code, 401)
            self.assertEqual(client.post("/auth/login", json={"kennung": user["kennung"], "passwort": "test-password"}).status_code, 200)


if __name__ == "__main__":
    unittest.main()
