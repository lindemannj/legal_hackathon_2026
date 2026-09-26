# API-Vertrag (Entwurf)

Der Prototyp nutzt in der Oberfläche weiterhin einen Mock (`src/services/mockBackend.ts`), der sich wie diese API verhält. Der separate Python-Server unter `backend/` implementiert derzeit die Endpunkte für Login, Demo-Konten, aktuelles Konto und Fälle sowie `/health`. Die übrigen hier beschriebenen Endpunkte sind noch Entwurf. Alle Stammdaten stammen aus `seed/demo-daten.txt`. Der Mock berechnet nichts Juristisches; er setzt Fälle aus `eingang` und `erwartet` zusammen und löst Namen über ids auf.

## Authentifizierung

### POST /auth/login
Body: `{ "kennung": string, "passwort": string }` → `200` mit dem Objekt aus `GET /me`, `401` bei unbekannter Kennung.
Im Demo-Modus wird jede Kennung aus der Seed-Datei mit beliebigem Passwort akzeptiert.

### GET /auth/demo-konten
Öffentlich. Liefert alle Benutzer mit `demoKonto: true` im Format von `GET /me`. Leere Liste → die Anmeldeseite blendet „Demo-Zugänge“ aus.

### GET /me

| Feld | Typ | Beschreibung |
|---|---|---|
| id | string | Benutzer-id, z. B. `richterin-hoffmann` |
| kennung | string | Anmeldekennung |
| name | string | Anzeigename |
| amtsbezeichnung | string | z. B. „Richterin am Amtsgericht“ |
| gerichtId | string | Gericht der ersten Einheit |
| gericht | string | Name dieses Gerichts |
| einheiten | `{ id, bezeichnung }[]` | Abteilungen/Kammern des Kontos |

## Fälle

### GET /faelle
Nur Fälle, deren zugewiesene Einheit zu den Einheiten des Kontos gehört. Fälle mit `nurSimulation` erscheinen erst nach einem simulierten EGVP-Eingang.

Fall (Auszug): `id`, `aktenzeichen`, `gerichtId`, `gericht`, `einheitId`, `einheit`, `richterId`, `richter`, `regelId`, `regelText`, `klaeger`, `beklagte`, `streitwert`, `eingang`, `uebermittlungsweg`, `kostenvorschuss`, `geprueftAm`, `anzahlAusgewertet`, `anzahlHinweise`, `befunde`.
Laufzeitfelder: `version` (Start 1, +1 je Änderung), `bearbeitungsstatus` (`eingang` / `beanstandet` / `erledigt`), `entscheidung`, `verlauf`.

Zuweisung: `{ gerichtId, einheitId, einheit, richterId, richter, regelId, regelText }`.

### GET /faelle/{id}

### POST /faelle/{id}/formulierungsvorschlag
Body: `{ "hinweisIds": string[] }` (ausgewählte Merkmal-ids) → `{ "text": string }`. Genutzt vom Button „Formulierungsvorschlag einfügen“ im Beanstanden-Dialog. Im Mock kommt der Text aus `erwartet.formulierungsvorschlag`.

## Stammdaten

- `GET /merkmale` – Prüfliste (100 Merkmale inkl. Platzhalter).
- `GET /gvp/einheiten` – Einheiten mit Richter:in und GVP-Regeltext.
- `GET /verfahrensregister`
- `GET /verfahrensregister/{az}` – ein Eintrag `{ aktenzeichen, gerichtId, gericht, parteien, status, zugestelltAm? }`, `404` wenn unbekannt. Genutzt für den Link zum möglicherweise identischen Verfahren.
