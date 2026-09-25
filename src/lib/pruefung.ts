import {
  aktivePruefpunkte,
  type Pruefpunkt,
  type PruefStatus,
} from "@/data/checklist";
import type { Fall } from "@/data/faelle";
import { euro } from "@/lib/format";
import {
  oertlicheZustaendigkeit,
  sachlicheZustaendigkeit,
} from "@/lib/zustaendigkeit";

export interface Pruefergebnis {
  punkt: Pruefpunkt;
  status: PruefStatus;
  begruendung: string;
  fundstelle?: string | undefined;
  eigen: boolean;
  notiz?: string | undefined;
  markerNr?: number | undefined;
}

export type EigeneBewertung = { status: PruefStatus; notiz?: string | undefined };

const keineAnhaltspunkte = new Set(["p6", "p13", "p14"]);

function standardBegruendung(punkt: Pruefpunkt, fall: Fall): string {
  switch (punkt.id) {
    case "p1":
      return `Gericht, Parteien und gesetzliche Vertretung sind vollständig bezeichnet (${fall.klaeger} ./. ${fall.beklagte}).`;
    case "p2":
      return "Der Klageantrag ist beziffert und vollstreckungsfähig formuliert.";
    case "p3":
      return "Der Lebenssachverhalt ist mit Datum, Beteiligten und Beweisangeboten individualisiert dargestellt.";
    case "p4":
      return "Die Klage ist durch eine zugelassene Rechtsanwältin bzw. einen zugelassenen Rechtsanwalt erhoben.";
    case "p5":
      return "Beim Eingang der Klage nicht anwendbar.";
    case "p6":
      return "Keine Anhaltspunkte für eine Befreiung von der deutschen Gerichtsbarkeit.";
    case "p7":
      return "Bürgerliche Rechtsstreitigkeit, der ordentliche Rechtsweg ist eröffnet (§ 13 GVG).";
    case "p8": {
      const s = sachlicheZustaendigkeit(fall.streitwert, fall.sachgebiet);
      return `${s.satz} (${s.norm}).`;
    }
    case "p9": {
      const o = oertlicheZustaendigkeit(fall.ortBeklagte, fall.gerichtstyp);
      return `${o.satz} (${o.norm}).`;
    }
    case "p10":
      return "Beide Parteien sind parteifähig (§ 50 ZPO).";
    case "p11":
      return "Keine Anhaltspunkte für fehlende Prozessfähigkeit; juristische Personen sind ordnungsgemäß vertreten.";
    case "p12":
      return "Die klagende Partei macht ein eigenes Recht im eigenen Namen geltend.";
    case "p13":
      return "Abgleich mit dem Verfahrensregister ohne Treffer.";
    case "p14":
      return "Abgleich mit dem Verfahrensregister ohne rechtskräftige Entscheidung zum selben Streitgegenstand.";
    case "p15":
      return "Leistungsklage, Rechtsschutzbedürfnis regelmäßig gegeben.";
    case "p16":
      return "Die geltend gemachten Ansprüche können verbunden werden (§ 260 ZPO).";
    case "p17":
      return `Eingang über ${fall.uebermittlungsweg}, sicherer Übermittlungsweg (§ 130a Abs. 3 ZPO).`;
    case "p18":
      return fall.prozessbevollmaechtigte
        ? "Anwaltlicher Schriftsatz elektronisch übermittelt (§ 130d ZPO)."
        : "Keine anwaltliche Vertretung, die Nutzungspflicht gilt nicht.";
    case "p19":
      return "XJustiz-Datensatz vorhanden, Angaben stimmen mit der Klageschrift überein.";
    case "p20":
      return "Ladungsfähige Anschrift der beklagten Partei ist angegeben.";
    case "p21":
      return `Streitwert mit ${euro(fall.streitwert)} angegeben.`;
    case "p22":
      return "Angaben zur außergerichtlichen Konfliktbeilegung sind enthalten.";
    case "p23":
      return "Eine Äußerung zur Entscheidung durch den Einzelrichter ist enthalten.";
    case "p24":
      return "Der Gerichtskostenvorschuss ist eingegangen.";
    case "p25":
      return "Keine Anhaltspunkte für eine obligatorische Streitschlichtung nach Landesrecht.";
    default:
      return "Keine Auffälligkeiten festgestellt.";
  }
}

export function pruefergebnisse(
  fall: Fall,
  eigene: Record<string, EigeneBewertung> = {},
): Pruefergebnis[] {
  let marker = 0;
  return aktivePruefpunkte.map((punkt) => {
    const befund = fall.befunde[punkt.id];
    let status: PruefStatus;
    let begruendung: string;

    if (!punkt.gerichte.includes(fall.gerichtstyp) || punkt.id === "p5") {
      status = "nicht_anwendbar";
      begruendung =
        punkt.id === "p5"
          ? "Beim Eingang der Klage nicht anwendbar."
          : `Dieser Prüfpunkt gilt nur vor dem ${punkt.gerichte.includes("LG") ? "Landgericht" : "Amtsgericht"}.`;
    } else if (befund) {
      status = befund.status;
      begruendung = befund.begruendung;
    } else {
      status = keineAnhaltspunkte.has(punkt.id) ? "keine_anhaltspunkte" : "erfuellt";
      begruendung = standardBegruendung(punkt, fall);
    }

    const fundstelle = befund?.fundstelle;
    const markerNr =
      fundstelle && (status === "mangel" || status === "pruefen")
        ? ++marker
        : undefined;

    const eigen = eigene[punkt.id];
    return {
      punkt,
      status: eigen ? eigen.status : status,
      begruendung,
      fundstelle,
      eigen: Boolean(eigen),
      notiz: eigen?.notiz,
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
    ergebnisse.filter((e) => e.status === s).length;
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
