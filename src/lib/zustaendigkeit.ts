import { euro } from "@/lib/format";
import { GvpService } from "@/services/mockBackend";
import type { Gerichtstyp, Sachgebiet, Spruchkoerper } from "@/types/domain";

export type { Sachgebiet };

export interface SachlichErgebnis {
  gerichtstyp: Gerichtstyp;
  satz: string;
  norm: string;
}

/** Deterministische sachliche Zuständigkeit, Stand 01.01.2026. */
export function sachlicheZustaendigkeit(
  streitwert: number,
  sachgebiet: Sachgebiet,
): SachlichErgebnis {
  if (sachgebiet === "wohnraummiete") {
    return {
      gerichtstyp: "AG",
      satz:
        "Amtsgericht ausschließlich zuständig, Streitigkeit über Wohnraummiete, unabhängig vom Streitwert",
      norm: "§ 23 Nr. 2 a GVG",
    };
  }
  if (sachgebiet === "nachbarrecht") {
    return {
      gerichtstyp: "AG",
      satz:
        "Amtsgericht zuständig, nachbarrechtliche Streitigkeit, unabhängig vom Streitwert",
      norm: "§ 23 Nr. 2 e GVG",
    };
  }
  if (
    sachgebiet === "heilbehandlung" ||
    sachgebiet === "veroeffentlichung" ||
    sachgebiet === "vergabe"
  ) {
    const bez = {
      heilbehandlung: "Streitigkeit aus einer Heilbehandlung",
      veroeffentlichung: "Veröffentlichungsstreitigkeit",
      vergabe: "Vergabesache",
    }[sachgebiet];
    return {
      gerichtstyp: "LG",
      satz: `Landgericht zuständig, ${bez}, unabhängig vom Streitwert`,
      norm: "§ 71 GVG",
    };
  }
  if (streitwert <= 10000) {
    return {
      gerichtstyp: "AG",
      satz: `Amtsgericht zuständig, Streitwert ${euro(streitwert)} bis 10.000 €`,
      norm: "§ 23 Nr. 1 GVG",
    };
  }
  return {
    gerichtstyp: "LG",
    satz: `Landgericht zuständig, Streitwert ${euro(streitwert)} übersteigt 10.000 €`,
    norm: "§ 71 Abs. 1 GVG",
  };
}

export function oertlicheZustaendigkeit(
  ortBeklagte: string,
  gerichtstyp: Gerichtstyp,
): { gericht: string | null; satz: string; norm: string } {
  const gericht = GvpService.gericht(ortBeklagte, gerichtstyp)?.name ?? null;
  return {
    gericht,
    satz: gericht
      ? `${gericht}, allgemeiner Gerichtsstand der beklagten Partei in ${ortBeklagte}`
      : `Kein Gerichtsbezirk hinterlegt für ${ortBeklagte}`,
    norm: "§§ 12, 13, 17 ZPO",
  };
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
  const wort =
    teile.length > 1 && /^[A-ZÄÖÜ]/.test(teile[teile.length - 1]!)
      ? teile[teile.length - 1]!
      : (teile[0] ?? "A");
  return wort.charAt(0).toUpperCase();
}

/** Interne Zuweisung nach den GVP-Regeln des Gerichts. */
export function interneZuweisung(
  gericht: string,
  sachgebiet: Sachgebiet,
  ersteBeklagtePartei: string,
): Spruchkoerper | undefined {
  const kandidaten = GvpService.spruchkoerper().filter((s) => s.gericht === gericht);
  const regeln = GvpService.regeln();
  const buchstabe = anfangsbuchstabe(ersteBeklagtePartei);
  const passt = (sg: Sachgebiet) =>
    kandidaten.find((s) => {
      const r = regeln.find((x) => x.id === s.regelId)!;
      if (r.bedingung.sachgebiet !== sg) return false;
      const b = r.bedingung.beklagteAnfangsbuchstaben;
      if (!b) return true;
      const [von, bis] = b.split("-");
      return buchstabe >= von! && buchstabe <= bis!;
    });
  return passt(sachgebiet) ?? passt("allgemein") ?? kandidaten[0];
}
