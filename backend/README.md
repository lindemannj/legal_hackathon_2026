# Klaris-Backend (Python)

FastAPI-Server für Meilenstein 1. Die React-Demo verwendet weiterhin ihren lokalen Mock; die HTTP-API kann separat gestartet und getestet werden. API-Vertrag: [`../docs/api-vertrag.md`](../docs/api-vertrag.md).

## Start

Python 3.12 oder neuer:

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# DEMO_PASSWORT und JWT_SECRET in .env setzen
.venv/bin/python -m app serve
```

Der Server läuft standardmäßig auf Port 3001. `/docs` zeigt die OpenAPI-Oberfläche. `DATABASE_URL=file:./dev.db` bezeichnet wie zuvor `backend/prisma/dev.db`; vorhandene Prisma-SQLite-Dateien mit diesem Schema werden weiterverwendet. Tabellen werden beim Start angelegt, wenn sie noch fehlen. `SEED_ON_START=true` importiert bei jedem Start die Stammdaten und erwarteten Fälle erneut, ohne Laufzeitfelder wie Fall-Version oder Bearbeitungsstatus zurückzusetzen.

Seed und Reset:

```sh
.venv/bin/python -m app seed
.venv/bin/python -m app reset
```

`reset` löscht alle Daten der Backend-Datenbank und importiert den Seed neu. Beide Befehle lesen ausschließlich `../seed/demo-daten.txt` als Stammdatenquelle. Fälle mit `nurSimulation` werden bis zur späteren EGVP-Eingangsroute nicht angelegt.

## Tests

```sh
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m unittest discover -s tests
```

Die implementierten Endpunkte sind `GET /health`, `POST /auth/login`, `GET /auth/demo-konten`, `GET /me`, `GET /faelle` und `GET /faelle/{id}`. Der Login gibt ein JWT im Feld `token` zurück. `GET /me` und die Fall-Endpunkte erwarten `Authorization: Bearer <token>`. Im Demo-Modus gilt für bekannte Kennungen jedes Passwort; mit `DEMO_MODE=false` wird der konfigurierte Demo-Passwort-Hash geprüft.
