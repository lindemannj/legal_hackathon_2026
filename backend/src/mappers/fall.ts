import type { Dokument, Einheit, Ergebnis, Fall, Gericht, GvpRegel, Benutzer } from "@prisma/client";

type FallMitRelationen = Fall & {
  gericht: Gericht;
  einheit: Einheit;
  richter: Benutzer;
  regel: GvpRegel | null;
  dokumente: Dokument[];
  ergebnisse: Ergebnis[];
};

interface Partei {
  name: string;
  art: "natuerlich" | "juristisch";
  anschrift?: string;
  vertretenDurch?: string;
}

interface ExtraktionJson {
  klaeger: Partei[];
  beklagte: Partei[];
  sachgebiet: string;
  streitwertCent: number;
  streitwertXJustizCent?: number;
  gegenstand?: string;
  prozessbevollmaechtigter?: string | null;
  xjustizFelder: Record<string, string>;
  xjustizAbweichungen: string[];
}

const namen = (p: Partei[]) => p.map((x) => x.name).join(", ");

export function alsFall(f: FallMitRelationen) {
  const x: ExtraktionJson = JSON.parse(f.extraktion ?? "{}");
  const klageschrift = f.dokumente.find((d) => d.typ === "klageschrift");

  return {
    id: f.id,
    aktenzeichen: f.vorlaeufigesAz,
    gerichtId: f.gericht.id,
    gericht: f.gericht.name,
    gerichtstyp: f.gericht.art,
    einheitId: f.einheit.id,
    einheit: f.einheit.bezeichnung,
    richterId: f.richter.id,
    richter: f.richter.name,
    regelId: f.regel?.id ?? "",
    regelText: f.regel?.regelText ?? "",
    klaeger: namen(x.klaeger ?? []),
    beklagte: namen(x.beklagte ?? []),
    klaegerParteien: x.klaeger ?? [],
    beklagteParteien: x.beklagte ?? [],
    sachgebiet: x.sachgebiet,
    streitwert: x.streitwertCent / 100,
    streitwertXJustiz: x.streitwertXJustizCent !== undefined ? x.streitwertXJustizCent / 100 : undefined,
    eingang: f.eingangAm,
    uebermittlungsweg: f.uebermittlungsweg,
    kostenvorschuss: f.kostenvorschuss,
    geprueftAm: f.ausgewertetAm ?? "",
    klageschriftId: klageschrift?.id ?? "",
    klageschrift: klageschrift?.text ?? "",
    anlagen: f.dokumente
      .filter((d) => d.typ === "anlage")
      .map((d) => {
        const [bez, ...rest] = d.name.split(" ");
        return { id: d.id, bezeichnung: bez ?? d.name, titel: rest.join(" "), seiten: d.seiten };
      }),
    xjustiz: Object.entries(x.xjustizFelder ?? {}).map(([label, wert]) => ({
      label,
      wert,
      abweichung: (x.xjustizAbweichungen ?? []).includes(label),
    })),
    xml: f.xjustizXml,
    befunde: Object.fromEntries(
      f.ergebnisse.map((e) => {
        const fundstellen: { dokumentId: string; zitat: string }[] = JSON.parse(e.fundstellen);
        return [
          e.merkmalId,
          {
            status: e.status,
            begruendung: e.text,
            relevanz: e.relevanz ?? undefined,
            grundlage: e.grundlage ?? undefined,
            fundstelle: fundstellen[0]?.zitat,
            dokumentId: fundstellen[0]?.dokumentId,
          },
        ];
      }),
    ),
    anzahlAusgewertet: f.ergebnisse.length,
    anzahlHinweise: f.ergebnisse.filter((e) => ["mangel", "pruefen", "offen"].includes(e.status)).length,
    nurSimulation: f.nurSimulation,
  };
}

export const fallInclude = {
  gericht: true,
  einheit: true,
  richter: true,
  regel: true,
  dokumente: true,
  ergebnisse: true,
} as const;
