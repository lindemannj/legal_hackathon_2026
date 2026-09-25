export type Gerichtstyp = "AG" | "LG";

export interface Spruchkoerper {
  id: string;
  gericht: string;
  gerichtstyp: Gerichtstyp;
  bezeichnung: string;
  richter: string;
  amtsbezeichnung: string;
  zustaendigkeit: string;
  regel: string;
}

export const spruchkoerper: Spruchkoerper[] = [
  {
    id: "ag-koeln-118",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    bezeichnung: "Abteilung 118",
    richter: "Klaus Brenner",
    amtsbezeichnung: "Richter am Amtsgericht",
    zustaendigkeit: "Wohnraummietsachen",
    regel:
      "GVP § 3 Abs. 1: Streitigkeiten aus Wohnraummietverhältnissen werden der Abteilung 118 zugewiesen.",
  },
  {
    id: "ag-koeln-142",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    bezeichnung: "Abteilung 142",
    richter: "Dr. Julia Hoffmann",
    amtsbezeichnung: "Richterin am Amtsgericht",
    zustaendigkeit: "Allgemeine Zivilsachen, erstgenannte beklagte Partei A bis K",
    regel:
      "GVP § 4 Abs. 2: Allgemeine Zivilsachen, bei denen der Anfangsbuchstabe der erstgenannten beklagten Partei in den Bereich A bis K fällt, werden der Abteilung 142 zugewiesen.",
  },
  {
    id: "ag-koeln-143",
    gericht: "Amtsgericht Köln",
    gerichtstyp: "AG",
    bezeichnung: "Abteilung 143",
    richter: "Mira Albers",
    amtsbezeichnung: "Richterin am Amtsgericht",
    zustaendigkeit: "Allgemeine Zivilsachen, erstgenannte beklagte Partei L bis Z",
    regel:
      "GVP § 4 Abs. 3: Allgemeine Zivilsachen, bei denen der Anfangsbuchstabe der erstgenannten beklagten Partei in den Bereich L bis Z fällt, werden der Abteilung 143 zugewiesen.",
  },
  {
    id: "lg-koeln-5",
    gericht: "Landgericht Köln",
    gerichtstyp: "LG",
    bezeichnung: "5. Zivilkammer",
    richter: "Tobias Wendt",
    amtsbezeichnung: "Richter am Landgericht",
    zustaendigkeit: "Allgemeine Zivilsachen im Turnus",
    regel:
      "GVP § 2 Abs. 1: Allgemeine Zivilsachen werden den Zivilkammern im Turnus zugewiesen; das Verfahren entfällt auf die 5. Zivilkammer (Berichterstatter Wendt).",
  },
  {
    id: "lg-koeln-25",
    gericht: "Landgericht Köln",
    gerichtstyp: "LG",
    bezeichnung: "25. Zivilkammer",
    richter: "Frank Osterloh",
    amtsbezeichnung: "Vorsitzender Richter am Landgericht",
    zustaendigkeit: "Streitigkeiten aus Heilbehandlungen",
    regel:
      "GVP § 2 Abs. 4: Streitigkeiten aus Heilbehandlungen werden der 25. Zivilkammer zugewiesen.",
  },
];

export function spruchkoerperById(id: string): Spruchkoerper | undefined {
  return spruchkoerper.find((s) => s.id === id);
}

const rechtsformen = [
  "GmbH & Co. KG",
  "GmbH",
  "AG",
  "UG (haftungsbeschränkt)",
  "KG",
  "OHG",
  "e.V.",
  "eG",
  "SE",
];

/** Erster Buchstabe des Nachnamens bzw. des Firmennamens ohne Rechtsform. */
export function anfangsbuchstabe(name: string): string {
  let n = name.trim();
  for (const rf of rechtsformen) {
    n = n.replace(new RegExp(`\\s*${rf.replace(/[.()]/g, "\\$&")}\\s*`, "gi"), " ");
  }
  n = n.replace(/^(Eheleute|Herr|Frau|Dr\.|Prof\.)\s+/i, "").trim();
  const teile = n.split(/\s+/).filter(Boolean);
  const wort = teile.length > 1 && /^[A-ZÄÖÜ]/.test(teile[teile.length - 1]!)
    ? teile[teile.length - 1]!
    : teile[0] ?? "A";
  return wort.charAt(0).toUpperCase();
}
