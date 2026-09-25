import { anfangsbuchstabe, spruchkoerper, type Gerichtstyp } from "@/data/gvp";
import { euro } from "@/lib/format";

export type Sachgebiet =
  | "allgemein"
  | "wohnraummiete"
  | "nachbarrecht"
  | "heilbehandlung"
  | "veroeffentlichung"
  | "vergabe";

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

const bezirke: Record<string, { AG: string; LG: string }> = {
  Köln: { AG: "Amtsgericht Köln", LG: "Landgericht Köln" },
  Bonn: { AG: "Amtsgericht Bonn", LG: "Landgericht Bonn" },
  München: { AG: "Amtsgericht München", LG: "Landgericht München I" },
};

export function oertlicheZustaendigkeit(
  ortBeklagte: string,
  gerichtstyp: Gerichtstyp,
): { gericht: string | null; satz: string; norm: string } {
  const eintrag = bezirke[ortBeklagte];
  const gericht = eintrag ? eintrag[gerichtstyp] : null;
  return {
    gericht,
    satz: gericht
      ? `${gericht}, allgemeiner Gerichtsstand der beklagten Partei in ${ortBeklagte}`
      : `Kein Gerichtsbezirk hinterlegt für ${ortBeklagte}`,
    norm: "§§ 12, 13, 17 ZPO",
  };
}

export function interneZuweisung(
  gericht: string,
  gerichtstyp: Gerichtstyp,
  sachgebiet: Sachgebiet,
  ersteBeklagtePartei: string,
) {
  const kandidaten = spruchkoerper.filter((s) => s.gericht === gericht);
  if (gerichtstyp === "AG") {
    if (sachgebiet === "wohnraummiete") {
      return kandidaten.find((s) => s.id === "ag-koeln-118") ?? kandidaten[0]!;
    }
    const buchstabe = anfangsbuchstabe(ersteBeklagtePartei);
    const bisK = buchstabe <= "K";
    return (
      kandidaten.find((s) => s.id === (bisK ? "ag-koeln-142" : "ag-koeln-143")) ??
      kandidaten[0]!
    );
  }
  if (sachgebiet === "heilbehandlung") {
    return kandidaten.find((s) => s.id === "lg-koeln-25") ?? kandidaten[0]!;
  }
  return kandidaten.find((s) => s.id === "lg-koeln-5") ?? kandidaten[0]!;
}
