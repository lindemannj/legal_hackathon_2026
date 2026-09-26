/** Fachliche Typen und feste Beschriftungen des Frontends (keine Stammdaten). */

export type Gerichtstyp = "AG" | "LG";

export type Sachgebiet =
  | "allgemein"
  | "wohnraummiete"
  | "nachbarrecht"
  | "heilbehandlung"
  | "veroeffentlichung"
  | "vergabe";

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
  nurAufRuege: boolean;
}

export interface Spruchkoerper {
  id: string;
  gerichtId: string;
  gericht: string;
  gerichtstyp: Gerichtstyp;
  bezeichnung: string;
  richterId: string;
  richter: string;
  amtsbezeichnung: string;
  zustaendigkeit: string;
  regelId: string;
  regel: string;
}

export interface Befund {
  status: PruefStatus;
  begruendung: string;
  relevanz?: "hoch" | "mittel" | "niedrig" | undefined;
  grundlage?: string | undefined;
  fundstelle?: string | undefined;
  fundstellen: string[];
  dokumentId?: string | undefined;
  verweisAz?: string | undefined;
}

export interface Partei {
  name: string;
  art: "natuerlich" | "juristisch";
  anschrift?: string | undefined;
  vertretenDurch?: string | undefined;
}

export interface XJustizFeld {
  label: string;
  wert: string;
  abweichung?: boolean | undefined;
}

export interface Anlage {
  id: string;
  bezeichnung: string;
  titel: string;
  seiten: number;
}

export interface Fall {
  id: string;
  aktenzeichen: string;
  gerichtId: string;
  gericht: string;
  gerichtstyp: Gerichtstyp;
  einheitId: string;
  einheit: string;
  richterId: string;
  richter: string;
  regelId: string;
  regelText: string;
  klaeger: string;
  beklagte: string;
  klaegerParteien: Partei[];
  beklagteParteien: Partei[];
  sachgebiet: Sachgebiet;
  streitwert: number;
  streitwertXJustiz?: number | undefined;
  eingang: string;
  uebermittlungsweg: string;
  kostenvorschuss: "bezahlt" | "offen";
  geprueftAm: string;
  klageschriftId: string;
  klageschrift: string;
  anlagen: Anlage[];
  xjustiz: XJustizFeld[];
  xml: string;
  /** vorberechnete Ergebnisse je Merkmal-id */
  befunde: Record<string, Befund>;
  anzahlAusgewertet: number;
  anzahlHinweise: number;
  nurSimulation?: boolean | undefined;
}

export interface VerfahrensregisterEintrag {
  aktenzeichen: string;
  gerichtId: string;
  gericht: string;
  zugestelltAm?: string | undefined;
  parteien: string;
  status: string;
}

export interface Einheit {
  id: string;
  bezeichnung: string;
}

/** Antwort von GET /me */
export interface Nutzer {
  id: string;
  kennung: string;
  name: string;
  amtsbezeichnung: string;
  gerichtId: string;
  gericht: string;
  einheiten: Einheit[];
}

/** Antwort von GET /auth/demo-konten */
export type DemoKonto = Nutzer;

export const kategorieLabel: Record<string, string> = {
  allgemein: "Allgemeine Prozessvoraussetzungen",
  hindernis: "Prozesshindernisse",
};

export const kategorien = Object.values(kategorieLabel);

export const statusLabel: Record<PruefStatus, string> = {
  erfuellt: "Unauffällig",
  mangel: "Auffälligkeit",
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

/** Hinweis auf allen automatischen Ampel-Badges. */
export const vorauswertungHinweis = "Automatische Vorauswertung, keine richterliche Feststellung.";
