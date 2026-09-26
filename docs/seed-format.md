# Seed-Format `seed/demo-daten.txt`

Ein JSON-Dokument (UTF-8, Endung .txt). Validiert durch das zod-Schema in `src/types/seed.ts`; zusätzlich werden alle id-Verweise geprüft. Beziehungen laufen ausschließlich über stabile, sprechende ids.

| Schlüssel | Inhalt |
|---|---|
| `schemaVersion` | Formatversion, aktuell `1`. |
| `gerichte[]` | `id`, `art` (`AG`/`LG`), `name`, `bezirk` (Ort für die örtliche Zuständigkeit). |
| `einheiten[]` | Abteilungen und Kammern: `id`, `gerichtId`, `bezeichnung`, `zustaendigkeit`. |
| `benutzer[]` | `id`, `kennung`, `name`, `amtsbezeichnung`, `rolle` (`richter`/`geschaeftsstelle`/`admin`), `einheitIds[]`, `demoKonto` (erscheint auf der Anmeldeseite). Keine Passwörter. |
| `gvpRegeln[]` | `id`, `gerichtId`, `einheitId`, `regelText`, `bedingung` mit `sachgebiet` und optional `beklagteAnfangsbuchstaben` (z. B. `"A-K"`). |
| `merkmale[]` | Prüfliste: `id` (`m-001` …), `nr`, `kategorie` (`A`–`G`), `titel`, `norm`, `quelle` (`regel`/`ki`/`manuell`), `beschreibung`, `gerichte[]`, `platzhalter`, `aktiv`. |
| `verfahrensregister[]` | `az`, `parteien`, `status`, optional `zugestelltAm` (ISO-Datum). |
| `faelle[]` | siehe unten |

## Fall

- `id` (`fall-0001` …), `gerichtId`, `nurSimulation` (nur über „EGVP-Eingang simulieren“ sichtbar).
- `eingang` – Rohmaterial: `eingangAm`, `uebermittlungsweg`, `aktenzeichen`, `angaben` (`klaeger`, `beklagte`, `ortBeklagte`, `gegenstand`, `sachgebiet`, `streitwert`, optional `streitwertXJustiz`, `prozessbevollmaechtigte`, `kostenvorschuss`), `klageschriftText`, `xjustizXml`, `xjustizFelder[]` (`label`, `wert`, optional `abweichung`), `anlagen[]` (`bezeichnung`, `titel`, `seiten`).
- `erwartet` – vorberechnete Demo-Ergebnisse, später Testfälle für das Backend:
  - `zuweisung`: `einheitId`, `richterId`, `regelId`
  - `auswertung`: `geprueftAm`, `ergebnisse[]` mit `merkmalId`, `status`, optional `relevanz`, `text`, optional `grundlage`, `fundstellen[]` (`zitat`). Merkmale ohne Eintrag gelten als erfüllt bzw. ohne Anhaltspunkte.
