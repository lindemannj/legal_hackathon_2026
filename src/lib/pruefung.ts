import { PruefService } from "@/services/mockBackend";
import type { Fall, Pruefpunkt, PruefStatus } from "@/types/domain";

export interface Pruefergebnis {
  punkt: Pruefpunkt;
  status: PruefStatus;
  begruendung: string;
  fundstelle?: string | undefined;
  fundstellen: string[];
  /** Prüfpunkt nur auf Rüge, bisher ohne Befund */
  nurAufRuege: boolean;
  verweisAz?: string | undefined;
  markerNr?: number | undefined;
}

/**
 * Verbindet die vorberechneten Ergebnisse des Falls mit der Prüfliste.
 * Keine juristische Berechnung im Frontend.
 */
export function pruefergebnisse(fall: Fall): Pruefergebnis[] {
  let marker = 0;
  return PruefService.aktive().map((punkt) => {
    const befund = fall.befunde[punkt.id];
    const status: PruefStatus = befund?.status ?? "offen";
    const begruendung = befund?.begruendung ?? "Für diesen Prüfpunkt liegt kein Ergebnis vor.";
    const fundstelle = befund?.fundstelle;
    const markerNr =
      fundstelle && (status === "mangel" || status === "pruefen" || status === "offen") ? ++marker : undefined;
    return {
      punkt,
      status,
      begruendung,
      fundstelle,
      fundstellen: befund?.fundstellen ?? [],
      nurAufRuege:
        punkt.nurAufRuege &&
        (status === "keine_anhaltspunkte" || status === "nicht_anwendbar"),
      verweisAz: befund?.verweisAz,
      markerNr,
    };
  });
}

export interface Bilanz {
  mangel: number;
  pruefen: number;
  offen: number;
  erfuellt: number;
  gesamtStatus: "ok" | "warn" | "err";
}

export function bilanz(ergebnisse: Pruefergebnis[]): Bilanz {
  const zaehle = (s: PruefStatus) =>
    ergebnisse.filter((e) => e.status === s && !e.nurAufRuege).length;
  const mangel = zaehle("mangel");
  const pruefen = zaehle("pruefen");
  const offen = zaehle("offen");
  const erfuellt = zaehle("erfuellt") + zaehle("keine_anhaltspunkte");
  return {
    mangel,
    pruefen,
    offen,
    erfuellt,
    gesamtStatus: mangel > 0 ? "err" : pruefen + offen > 0 ? "warn" : "ok",
  };
}
