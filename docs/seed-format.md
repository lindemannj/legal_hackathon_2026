# Seed-Format `seed/demo-daten.txt`

Ein JSON-Dokument (UTF-8, Endung .txt). Validiert durch das zod-Schema in `src/types/seed.ts`; zusätzlich werden alle id-Verweise geprüft. Beziehungen laufen ausschließlich über stabile, sprechende ids.

| Schlüssel | Inhalt |
|---|---|
| `schemaVersion` | Formatversion, aktuell `1`. |
| `meta` | `regelwerkVersion` (z. B. „GVG/ZPO Stand 01.01.2026“), `modellVersion` (z. B. „Demo“). |
| `gerichte[]` | `id`, `art` (`AG`/`LG`), `name`, `bezirk`. |
| `einheiten[]` | Abteilungen und Kammern: `id`, `gerichtId`, `bezeichnung`, `zustaendigkeit`. |
| `benutzer[]` | `id`, `kennung`, `name`, `amtsbezeichnung`, `rolle` (`richter`/`geschaeftsstelle`/`admin`), `einheitIds[]`, `demoKonto`. Keine Passwörter. |
| `gvpRegeln[]` | `id`, `gerichtId`, `einheitId`, `regelText`, optional `kurzText` (Zuständigkeitsblock) und `vorrang` (kleiner = vorrangig), `bedingung` (`sachgebiet`, optional `sachgebieteZusaetzlich[]`, `eingangsnummerEndziffer`, `beklagteAnfangsbuchstaben` wie `"A-K"`). |
| `merkmale[]` | 16 Prüfpunkte nach Lorenz: `id` (`L01` … `L16`), `nr`, `kategorie` (`allgemein`/`hindernis`), `titel`, `norm`, `quelle` (`regel`/`ki`/`manuell`), `beschreibung`, `gerichte[]`, `nurAufRuege`, `aktiv`. |
| `verfahrensregister[]` | `az`, `gerichtId`, `parteien`, `status`, optional `zugestelltAm` (ISO-Datum). |
| `faelle[]` | siehe unten |

## Fall

Direkt am Fall: `id` (`fall-0001` …), `gerichtId`, `vorlaeufigesAz`, `nurSimulation` (erscheint nur über „EGVP-Eingang simulieren“, jeder genau einmal).

### `eingang` – Rohmaterial aus EGVP und Kasse
- `eingangAm`, `uebermittlungsweg`, `kostenvorschuss` (`bezahlt`/`offen`), `xjustizXml`
- `dokumente[]`: `id` (z. B. `fall-0002-klageschrift`, `fall-0002-k1`), `typ` (`klageschrift`/`anlage`), `name`, `seiten`, bei der Klageschrift zusätzlich `text`.

### `erwartet` – später vom Backend berechnet, dient dann als Testfall
- `extraktion`: `klaeger[]` und `beklagte[]` (`name`, `art` `natuerlich`/`juristisch`, optional `anschrift`, `vertretenDurch`), `sachgebiet`, `streitwertCent`, optional `streitwertXJustizCent`, `gegenstand`, `prozessbevollmaechtigter`.
- `xjustizFelder`: Objekt Beschriftung → Wert.
- `xjustizAbweichungen[]`: Beschriftungen, deren Wert von der Klageschrift abweicht.
- `zuweisung`: `einheitId`, `richterId`, `regelId`.
- `auswertung`: `geprueftAm`, `ergebnisse[]` je aktivem Merkmal mit `merkmalId`, `status`, `relevanz` (`hoch`/`mittel`/`niedrig`), `text`, `grundlage`, `fundstellen[]` (`dokumentId`, `zitat`), optional `verweisAz` (Verweis ins Verfahrensregister).
- `formulierungsvorschlag`: Text für den Beanstanden-Dialog.

Nicht in der Datei: `version`, `bearbeitungsstatus`, `entscheidung`, `verlauf`. Der Mock setzt sie beim Laden (Version 1, Status Eingang, Verlauf mit Eingang, Zuweisung und Auswertung).
