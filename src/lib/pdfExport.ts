import { jsPDF } from "jspdf";

import type { Fall } from "@/types/domain";
import { GvpService } from "@/services/mockBackend";
const spruchkoerperById = (id: string) => GvpService.einheit(id);
import { datumZeit, euro } from "@/lib/format";
import type { Pruefergebnis } from "@/lib/pruefung";

const RAND = 18;
const BREITE = 210 - RAND * 2;

export function exportiereMarkiertesPdf(fall: Fall, ergebnisse: Pruefergebnis[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sk = spruchkoerperById(fall.spruchkoerperId);
  let y = RAND;

  const zeile = (
    text: string,
    size = 10,
    stil: "normal" | "bold" = "normal",
    abstand = 5,
  ) => {
    doc.setFont("helvetica", stil);
    doc.setFontSize(size);
    const teile = doc.splitTextToSize(text, BREITE) as string[];
    for (const t of teile) {
      if (y > 275) {
        doc.addPage();
        y = RAND;
      }
      doc.text(t, RAND, y);
      y += abstand;
    }
  };

  zeile("Prüfbericht zur Eingangsprüfung", 16, "bold", 8);
  zeile(`Aktenzeichen: ${fall.aktenzeichen}`, 11, "bold", 6);
  zeile(`Gericht: ${fall.gericht}`);
  zeile(`Parteien: ${fall.klaeger} ./. ${fall.beklagte}`);
  zeile(`Streitwert: ${euro(fall.streitwert)}`);
  zeile(`Zuweisung: ${sk?.bezeichnung ?? ""} · ${sk?.richter ?? ""}`);
  zeile(`Regel: ${sk?.regel ?? ""}`, 9);
  zeile(`Automatisch geprüft am ${datumZeit(fall.geprueftAm)}`);
  y += 3;

  const auffaellig = ergebnisse.filter(
    (e) => e.status === "mangel" || e.status === "pruefen" || e.status === "offen",
  );
  zeile(
    auffaellig.length === 0
      ? "Ergebnis: Keine Beanstandungen"
      : `Ergebnis: ${ergebnisse.filter((e) => e.status === "mangel").length} Mängel, ${ergebnisse.filter((e) => e.status === "pruefen").length} Punkte bitte prüfen, ${ergebnisse.filter((e) => e.status === "offen").length} offen`,
    12,
    "bold",
    7,
  );

  for (const e of auffaellig) {
    zeile(
      `Nr. ${e.punkt.nr} · ${e.punkt.titel} (${e.punkt.norm})`,
      10,
      "bold",
      5,
    );
    zeile(e.begruendung, 10, "normal", 5);
    if (e.notiz) zeile(`Notiz: ${e.notiz}`, 9);
    y += 2;
  }

  y += 4;
  zeile(
    "Hinweis: Automatische Vorprüfung, keine richterliche Entscheidung.",
    9,
    "bold",
  );

  // Ab Seite 2: Klageschrift mit Markierungen
  doc.addPage();
  y = RAND;
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const markierungen = ergebnisse
    .filter((e) => e.fundstelle && e.markerNr)
    .map((e) => ({ text: e.fundstelle!, nr: e.markerNr!, status: e.status }));

  for (const absatz of fall.klageschrift.split("\n")) {
    const zeilen = doc.splitTextToSize(absatz || " ", BREITE) as string[];
    for (const t of zeilen) {
      if (y > 280) {
        doc.addPage();
        y = RAND;
        doc.setFont("times", "normal");
        doc.setFontSize(11);
      }
      const treffer = markierungen.find((m) => t.includes(m.text));
      if (treffer) {
        const farbe: [number, number, number] =
          treffer.status === "mangel" ? [254, 226, 226] : [254, 243, 199];
        doc.setFillColor(farbe[0], farbe[1], farbe[2]);
        doc.rect(RAND - 1, y - 4, BREITE + 2, 6, "F");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(String(treffer.nr), RAND - 6, y);
        doc.setTextColor(0);
        doc.setFontSize(11);
      }
      doc.text(t, RAND, y);
      y += 5.6;
    }
  }

  doc.save(`Klageschrift_${fall.aktenzeichen.replace(/[ /]/g, "-")}_markiert.pdf`);
}
