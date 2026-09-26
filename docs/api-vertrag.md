# API-Vertrag (Entwurf)

Der Prototyp nutzt einen Mock (`src/services/mockBackend.ts`), der sich wie diese API verhält. Alle Stammdaten stammen aus `seed/demo-daten.txt`.

## Authentifizierung

### POST /auth/login
Body: `{ "kennung": string, "passwort": string }` → `200` mit dem Objekt aus `GET /me`, `401` bei unbekannter Kennung.
Im Demo-Modus wird jede Kennung aus der Seed-Datei mit beliebigem Passwort akzeptiert.

### GET /auth/demo-konten
Öffentlich. Liefert alle Benutzer mit `demoKonto: true` im selben Format wie `GET /me`. Leere Liste → die Anmeldeseite blendet den Bereich „Demo-Zugänge“ aus.

### GET /me
Liefert das angemeldete Konto. Header, Zuweisungsanzeige und Filter lesen ausschließlich diese Daten.

| Feld | Typ | Beschreibung |
|---|---|---|
| id | string | Benutzer-id, z. B. `richterin-hoffmann` |
| kennung | string | Anmeldekennung, z. B. `j.hoffmann` |
| name | string | Anzeigename |
| amtsbezeichnung | string | z. B. „Richterin am Amtsgericht“ |
| gerichtId | string | Gericht der ersten Einheit |
| gericht | string | Name dieses Gerichts |
| einheiten | `{ id, bezeichnung }[]` | Abteilungen/Kammern des Kontos |

## Fachdaten

- `GET /faelle` – nur Fälle, deren zugewiesene Einheit zu den Einheiten des Kontos gehört.
- `GET /faelle/:id`
- `GET /merkmale` – Prüfliste (100 Merkmale inkl. Platzhalter).
- `GET /gvp/einheiten` – Einheiten mit Richter:in und GVP-Regeltext.
- `GET /verfahrensregister`
