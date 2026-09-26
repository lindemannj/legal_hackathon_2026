# Klaris-Backend

Lokales Backend für das Klaris-Frontend (siehe `../docs/api-vertrag.md`, `../docs/seed-format.md`).

## Start

```
cp .env.example .env   # DEMO_PASSWORT und JWT_SECRET setzen
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

`SEED_ON_START=true` seedet bei jedem Start (Upsert, keine Duplikate). Alternativ `npm run seed` bzw. `npm run reset` (leert und seedet neu).

## Offene Entscheidungen aus dem Auftrag

- **Ablage von `xjustizFelder`/`xjustizAbweichungen`**: Der Vertrag nennt kein eigenes Datenmodell-Feld dafür. Sie liegen zusammen mit `erwartet.extraktion` im JSON-Textfeld `Fall.extraktion`.
- **Token-Transport nach Login**: `POST /auth/login` liefert zusätzlich zum `GET /me`-Objekt ein Feld `token` (JWT), da der Vertrag den Transportweg offen lässt und das Frontend noch keine Cookie-Handhabung hat.
- **`GvpRegel.prioritaet`/`turnusGruppe`**: In der Seed-Datei nicht vorhanden (dort nur `sachgebiet`/`beklagteAnfangsbuchstaben`). Felder existieren im Schema für Meilenstein 3, sind bis dahin `0`/`null`.
- **Kennung-Vergleich beim Login**: SQLite unterstützt in Prisma kein `mode: "insensitive"`; der Vergleich läuft in JS (kleine Demo-Datenmenge).

## Meilenstein 1 – Status

Login, `GET /me`, `GET /auth/demo-konten`, `GET /faelle`, `GET /faelle/{id}` (inkl. Dokumenttext) sind fertig. Fälle mit `nurSimulation` werden beim Seed übersprungen (folgen mit `POST /demo/eingang` in Meilenstein 3). Auswertungsergebnisse und Zuweisung kommen für M1 unverändert aus `erwartet` in der Seed-Datei — die eigentliche Pipeline (GVP-Zuweisung, Regel-/KI-Merkmale) folgt in M3/M4.
