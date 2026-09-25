import type { Gerichtstyp } from "@/data/gvp";

export type Quelle = "regel" | "ki" | "manuell";

export type PruefStatus =
  | "erfuellt"
  | "mangel"
  | "pruefen"
  | "offen"
  | "keine_anhaltspunkte"
  | "nicht_anwendbar";

export interface Pruefpunkt {
  id: string;
  nr: number;
  kategorie: string;
  titel: string;
  norm: string;
  quelle: Quelle;
  beschreibung: string;
  gerichte: Gerichtstyp[];
  platzhalter: boolean;
}

export const kategorien = [
  "A · Ordnungsgemäße Klageerhebung",
  "B · Gerichtsbezogene Sachurteilsvoraussetzungen",
  "C · Parteibezogene Sachurteilsvoraussetzungen",
  "D · Streitgegenstandsbezogene Sachurteilsvoraussetzungen",
  "E · Rechtsschutzbedürfnis",
  "F · Objektive Klagehäufung",
  "G · Eingangsformalien",
] as const;

const beide: Gerichtstyp[] = ["AG", "LG"];

const aktive: Omit<Pruefpunkt, "id" | "platzhalter">[] = [
  {
    nr: 1,
    kategorie: kategorien[0],
    titel: "Bezeichnung der Parteien und des Gerichts",
    norm: "§ 253 Abs. 2 Nr. 1 ZPO",
    quelle: "regel",
    beschreibung:
      "Die Klageschrift muss das angerufene Gericht sowie die Parteien mit ladungsfähiger Anschrift und gesetzlicher Vertretung eindeutig bezeichnen.",
    gerichte: beide,
  },
  {
    nr: 2,
    kategorie: kategorien[0],
    titel: "Bestimmter Klageantrag",
    norm: "§ 253 Abs. 2 Nr. 2 ZPO",
    quelle: "ki",
    beschreibung:
      "Der Klageantrag muss so bestimmt sein, dass er Grundlage eines vollstreckungsfähigen Titels sein kann.",
    gerichte: beide,
  },
  {
    nr: 3,
    kategorie: kategorien[0],
    titel: "Angabe von Gegenstand und Grund des Anspruchs (Klagegrund)",
    norm: "§ 253 Abs. 2 Nr. 2 ZPO",
    quelle: "ki",
    beschreibung:
      "Der Lebenssachverhalt, aus dem der Anspruch hergeleitet wird, muss erkennbar und individualisierbar dargestellt sein.",
    gerichte: beide,
  },
  {
    nr: 4,
    kategorie: kategorien[0],
    titel: "Klageerhebung durch Rechtsanwalt im Anwaltsprozess",
    norm: "§ 78 ZPO",
    quelle: "regel",
    beschreibung:
      "Vor den Landgerichten müssen sich die Parteien durch einen Rechtsanwalt vertreten lassen.",
    gerichte: ["LG"],
  },
  {
    nr: 5,
    kategorie: kategorien[0],
    titel: "Klageänderung oder Klageerweiterung",
    norm: "§§ 263, 264 ZPO",
    quelle: "manuell",
    beschreibung:
      "Bei Änderung oder Erweiterung der Klage ist deren Zulässigkeit zu prüfen. Beim Eingang einer Klage regelmäßig nicht anwendbar.",
    gerichte: beide,
  },
  {
    nr: 6,
    kategorie: kategorien[1],
    titel: "Deutsche Gerichtsbarkeit",
    norm: "§§ 18-20 GVG",
    quelle: "regel",
    beschreibung:
      "Die Parteien dürfen nicht von der deutschen Gerichtsbarkeit befreit sein (Immunität).",
    gerichte: beide,
  },
  {
    nr: 7,
    kategorie: kategorien[1],
    titel: "Zulässigkeit des Rechtswegs",
    norm: "§ 13 GVG",
    quelle: "ki",
    beschreibung:
      "Für bürgerliche Rechtsstreitigkeiten ist der ordentliche Rechtsweg eröffnet.",
    gerichte: beide,
  },
  {
    nr: 8,
    kategorie: kategorien[1],
    titel: "Sachliche Zuständigkeit",
    norm: "§§ 23, 71 GVG, §§ 38-40 ZPO",
    quelle: "regel",
    beschreibung:
      "Die sachliche Zuständigkeit richtet sich nach Streitwert und Sachgebiet.",
    gerichte: beide,
  },
  {
    nr: 9,
    kategorie: kategorien[1],
    titel: "Örtliche Zuständigkeit",
    norm: "§§ 12 ff. ZPO",
    quelle: "regel",
    beschreibung:
      "Maßgeblich ist der allgemeine Gerichtsstand der beklagten Partei, soweit kein besonderer Gerichtsstand greift.",
    gerichte: beide,
  },
  {
    nr: 10,
    kategorie: kategorien[2],
    titel: "Parteifähigkeit",
    norm: "§ 50 ZPO",
    quelle: "regel",
    beschreibung:
      "Parteifähig ist, wer rechtsfähig ist; für Gesellschaften gelten Sonderregeln.",
    gerichte: beide,
  },
  {
    nr: 11,
    kategorie: kategorien[2],
    titel: "Prozessfähigkeit und ordnungsgemäße Vertretung",
    norm: "§§ 51, 52 ZPO",
    quelle: "ki",
    beschreibung:
      "Die Parteien müssen prozessfähig oder ordnungsgemäß gesetzlich vertreten sein.",
    gerichte: beide,
  },
  {
    nr: 12,
    kategorie: kategorien[2],
    titel: "Prozessführungsbefugnis",
    norm: "§ 51 Abs. 1 ZPO",
    quelle: "ki",
    beschreibung:
      "Die klagende Partei muss befugt sein, das behauptete Recht im eigenen Namen geltend zu machen.",
    gerichte: beide,
  },
  {
    nr: 13,
    kategorie: kategorien[3],
    titel: "Keine anderweitige Rechtshängigkeit",
    norm: "§ 261 Abs. 3 Nr. 1 ZPO",
    quelle: "regel",
    beschreibung:
      "Abgleich mit dem Verfahrensregister: derselbe Streitgegenstand darf nicht bereits rechtshängig sein.",
    gerichte: beide,
  },
  {
    nr: 14,
    kategorie: kategorien[3],
    titel: "Keine entgegenstehende Rechtskraft",
    norm: "§ 322 ZPO",
    quelle: "regel",
    beschreibung:
      "Abgleich mit dem Verfahrensregister: über denselben Streitgegenstand darf nicht bereits rechtskräftig entschieden sein.",
    gerichte: beide,
  },
  {
    nr: 15,
    kategorie: kategorien[4],
    titel: "Allgemeines Rechtsschutzbedürfnis",
    norm: "Allgemeine Sachurteilsvoraussetzung",
    quelle: "ki",
    beschreibung:
      "Bei Leistungsklagen regelmäßig gegeben; Anhaltspunkte für einen einfacheren Weg sind zu prüfen.",
    gerichte: beide,
  },
  {
    nr: 16,
    kategorie: kategorien[5],
    titel: "Zulässigkeit der Klagehäufung",
    norm: "§ 260 ZPO",
    quelle: "regel",
    beschreibung:
      "Mehrere Ansprüche können verbunden werden, wenn dasselbe Gericht zuständig und dieselbe Prozessart statthaft ist. Die sachliche Zuständigkeit kann sich aus den zusammengerechneten Anträgen ergeben (§ 5 ZPO).",
    gerichte: beide,
  },
  {
    nr: 17,
    kategorie: kategorien[6],
    titel: "Sicherer Übermittlungsweg oder qualifizierte elektronische Signatur",
    norm: "§ 130a Abs. 3 ZPO",
    quelle: "regel",
    beschreibung:
      "Das elektronische Dokument muss signiert oder auf einem sicheren Übermittlungsweg eingereicht sein.",
    gerichte: beide,
  },
  {
    nr: 18,
    kategorie: kategorien[6],
    titel: "Nutzungspflicht des elektronischen Rechtsverkehrs für Anwälte",
    norm: "§ 130d ZPO",
    quelle: "regel",
    beschreibung:
      "Rechtsanwältinnen und Rechtsanwälte müssen vorbereitende Schriftsätze elektronisch übermitteln.",
    gerichte: beide,
  },
  {
    nr: 19,
    kategorie: kategorien[6],
    titel: "XJustiz-Datensatz vorhanden und stimmig mit der Klageschrift",
    norm: "§ 2 Abs. 3 ERVV",
    quelle: "regel",
    beschreibung:
      "Dem Schriftsatz ist ein strukturierter Datensatz beizufügen; dessen Angaben werden mit der Klageschrift abgeglichen.",
    gerichte: beide,
  },
  {
    nr: 20,
    kategorie: kategorien[6],
    titel: "Ladungsfähige Anschrift der beklagten Partei",
    norm: "§ 253 Abs. 2 Nr. 1 ZPO",
    quelle: "regel",
    beschreibung: "Für die Zustellung ist eine ladungsfähige Anschrift erforderlich.",
    gerichte: beide,
  },
  {
    nr: 21,
    kategorie: kategorien[6],
    titel: "Streitwertangabe, falls kein bezifferter Geldbetrag",
    norm: "§ 253 Abs. 3 Nr. 2 ZPO",
    quelle: "regel",
    beschreibung:
      "Ist der Streitgegenstand kein bestimmter Geldbetrag, soll der Wert angegeben werden.",
    gerichte: beide,
  },
  {
    nr: 22,
    kategorie: kategorien[6],
    titel: "Angaben zur außergerichtlichen Konfliktbeilegung",
    norm: "§ 253 Abs. 3 Nr. 1 ZPO",
    quelle: "ki",
    beschreibung:
      "Sollvorschrift: Angabe, ob dem Verfahren ein Mediations- oder Schlichtungsversuch vorausging. Verstoß führt nicht zur Unzulässigkeit, daher höchstens Hinweis.",
    gerichte: beide,
  },
  {
    nr: 23,
    kategorie: kategorien[6],
    titel: "Äußerung zur Entscheidung durch den Einzelrichter",
    norm: "§ 253 Abs. 3 Nr. 3 ZPO",
    quelle: "regel",
    beschreibung:
      "Die Klageschrift soll eine Äußerung dazu enthalten, ob einer Entscheidung durch den Einzelrichter entgegengetreten wird.",
    gerichte: ["LG"],
  },
  {
    nr: 24,
    kategorie: kategorien[6],
    titel: "Gerichtskostenvorschuss eingezahlt",
    norm: "§ 12 Abs. 1 GKG",
    quelle: "regel",
    beschreibung:
      "Die Klage wird erst nach Zahlung des Vorschusses zugestellt. Offener Vorschuss ist kein Zulässigkeitsmangel.",
    gerichte: beide,
  },
  {
    nr: 25,
    kategorie: kategorien[6],
    titel: "Obligatorische Streitschlichtung nach Landesrecht",
    norm: "§ 15a EGZPO",
    quelle: "ki",
    beschreibung:
      "In bestimmten Streitigkeiten ist vor Klageerhebung ein Schlichtungsversuch durchzuführen; die Bescheinigung ist vorzulegen.",
    gerichte: beide,
  },
];

const platzhalterVerteilung: string[] = [];
for (let i = 26; i <= 100; i++) {
  platzhalterVerteilung.push(kategorien[(i - 26) % kategorien.length]!);
}

export const checkliste: Pruefpunkt[] = [
  ...aktive.map((p) => ({
    ...p,
    id: `p${p.nr}`,
    platzhalter: false,
  })),
  ...platzhalterVerteilung.map((kategorie, index) => {
    const nr = 26 + index;
    return {
      id: `p${nr}`,
      nr,
      kategorie,
      titel: "Prüfpunkt in Vorbereitung",
      norm: "—",
      quelle: "regel" as Quelle,
      beschreibung:
        "Dieser Prüfpunkt ist im Prototyp noch nicht hinterlegt und wird nicht ausgewertet.",
      gerichte: beide,
      platzhalter: true,
    };
  }),
];

export const aktivePruefpunkte = checkliste.filter((p) => !p.platzhalter);

export function pruefpunktById(id: string): Pruefpunkt | undefined {
  return checkliste.find((p) => p.id === id);
}

export const statusLabel: Record<PruefStatus, string> = {
  erfuellt: "Erfüllt",
  mangel: "Mangel",
  pruefen: "Bitte prüfen",
  offen: "Offen",
  keine_anhaltspunkte: "Keine Anhaltspunkte",
  nicht_anwendbar: "Nicht anwendbar",
};

export const quelleLabel: Record<Quelle, string> = {
  regel: "Regel",
  ki: "KI-Hinweis",
  manuell: "Manuell",
};
