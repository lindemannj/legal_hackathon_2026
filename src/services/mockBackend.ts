/**
 * Mock-Backend: einzige Stelle, die seed/demo-daten.txt liest.
 * Verhält sich wie die spätere API (GET /faelle, GET /me, GET /auth/demo-konten …).
 */
import roh from "../../seed/demo-daten.txt?raw";

import { seedSchema, type Seed } from "@/types/seed";
import {
  kategorieLabel,
  type DemoKonto,
  type Fall,
  type Nutzer,
  type Pruefpunkt,
  type Spruchkoerper,
  type VerfahrensregisterEintrag,
} from "@/types/domain";

export interface SeedFehler {
  pfad: string;
  meldung: string;
}

function lade(): { seed: Seed | null; fehler: SeedFehler[] } {
  let json: unknown;
  try {
    json = JSON.parse(roh);
  } catch (e) {
    return {
      seed: null,
      fehler: [{ pfad: "(Datei)", meldung: `Kein gültiges JSON: ${(e as Error).message}` }],
    };
  }
  const r = seedSchema.safeParse(json);
  if (!r.success) {
    return {
      seed: null,
      fehler: r.error.issues.map((i) => ({
        pfad: i.path.join(".") || "(Wurzel)",
        meldung: i.message,
      })),
    };
  }
  // Referenzen prüfen
  const s = r.data;
  const fehler: SeedFehler[] = [];
  const gIds = new Set(s.gerichte.map((g) => g.id));
  const eIds = new Set(s.einheiten.map((e) => e.id));
  const bIds = new Set(s.benutzer.map((b) => b.id));
  const rIds = new Set(s.gvpRegeln.map((g) => g.id));
  const mIds = new Set(s.merkmale.map((m) => m.id));
  s.einheiten.forEach((e, i) => {
    if (!gIds.has(e.gerichtId))
      fehler.push({ pfad: `einheiten.${i}.gerichtId`, meldung: `Unbekanntes Gericht „${e.gerichtId}“` });
  });
  s.benutzer.forEach((b, i) =>
    b.einheitIds.forEach((id, j) => {
      if (!eIds.has(id))
        fehler.push({ pfad: `benutzer.${i}.einheitIds.${j}`, meldung: `Unbekannte Einheit „${id}“` });
    }),
  );
  s.gvpRegeln.forEach((g, i) => {
    if (!eIds.has(g.einheitId))
      fehler.push({ pfad: `gvpRegeln.${i}.einheitId`, meldung: `Unbekannte Einheit „${g.einheitId}“` });
  });
  s.faelle.forEach((f, i) => {
    const z = f.erwartet.zuweisung;
    if (!gIds.has(f.gerichtId))
      fehler.push({ pfad: `faelle.${i}.gerichtId`, meldung: `Unbekanntes Gericht „${f.gerichtId}“` });
    if (!eIds.has(z.einheitId))
      fehler.push({ pfad: `faelle.${i}.erwartet.zuweisung.einheitId`, meldung: `Unbekannte Einheit „${z.einheitId}“` });
    if (!bIds.has(z.richterId))
      fehler.push({ pfad: `faelle.${i}.erwartet.zuweisung.richterId`, meldung: `Unbekannter Benutzer „${z.richterId}“` });
    if (!rIds.has(z.regelId))
      fehler.push({ pfad: `faelle.${i}.erwartet.zuweisung.regelId`, meldung: `Unbekannte GVP-Regel „${z.regelId}“` });
    const dIds = new Set(f.eingang.dokumente.map((d) => d.id));
    f.erwartet.auswertung.ergebnisse.forEach((e, j) => {
      if (!mIds.has(e.merkmalId))
        fehler.push({
          pfad: `faelle.${i}.erwartet.auswertung.ergebnisse.${j}.merkmalId`,
          meldung: `Unbekanntes Merkmal „${e.merkmalId}“`,
        });
      e.fundstellen.forEach((fs, k) => {
        if (!dIds.has(fs.dokumentId))
          fehler.push({
            pfad: `faelle.${i}.erwartet.auswertung.ergebnisse.${j}.fundstellen.${k}.dokumentId`,
            meldung: `Unbekanntes Dokument „${fs.dokumentId}“`,
          });
      });
    });
  });
  return { seed: fehler.length ? null : s, fehler };
}

const geladen = lade();
export const seedFehler: SeedFehler[] = geladen.fehler;

const leer: Seed = {
  schemaVersion: 1,
  meta: { regelwerkVersion: "", modellVersion: "" },
  gerichte: [],
  einheiten: [],
  benutzer: [],
  gvpRegeln: [],
  merkmale: [],
  verfahrensregister: [],
  faelle: [],
};
const seed: Seed = geladen.seed ?? leer;

// ---------- abgeleiteter Zustand ----------

const gerichtById = new Map(seed.gerichte.map((g) => [g.id, g]));
const einheitById = new Map(seed.einheiten.map((e) => [e.id, e]));

const checkliste: Pruefpunkt[] = [...seed.merkmale]
  .sort((a, b) => a.nr - b.nr)
  .map((m) => ({
    id: m.id,
    nr: m.nr,
    kategorie: kategorieLabel[m.kategorie] ?? m.kategorie,
    titel: m.titel,
    norm: m.norm,
    quelle: m.quelle,
    beschreibung: m.beschreibung,
    gerichte: m.gerichte,
    nurAufRuege: m.nurAufRuege,
  }));
const aktiveIds = new Set(seed.merkmale.filter((m) => m.aktiv).map((m) => m.id));

const spruchkoerper: Spruchkoerper[] = seed.gvpRegeln.map((r) => {
  const e = einheitById.get(r.einheitId)!;
  const g = gerichtById.get(e.gerichtId)!;
  const richter = seed.benutzer.find((b) => b.rolle === "richter" && b.einheitIds.includes(e.id));
  return {
    id: e.id,
    gerichtId: g.id,
    gericht: g.name,
    gerichtstyp: g.art,
    bezeichnung: e.bezeichnung,
    richterId: richter?.id ?? "",
    richter: richter?.name ?? "",
    amtsbezeichnung: richter?.amtsbezeichnung ?? "",
    zustaendigkeit: e.zustaendigkeit,
    regelId: r.id,
    regel: r.regelText,
  };
});

const benutzerById = new Map(seed.benutzer.map((b) => [b.id, b]));
const regelById = new Map(seed.gvpRegeln.map((r) => [r.id, r]));
const namen = (p: { name: string }[]) => p.map((x) => x.name).join(", ");

/** Baut Fall-Objekte aus eingang + erwartet; keine juristische Berechnung. */
const faelle: Fall[] = seed.faelle.map((f) => {
  const g = gerichtById.get(f.gerichtId)!;
  const x = f.erwartet.extraktion;
  const z = f.erwartet.zuweisung;
  const ks = f.eingang.dokumente.find((d) => d.typ === "klageschrift")!;
  const ergebnisse = f.erwartet.auswertung.ergebnisse;
  return {
    id: f.id,
    aktenzeichen: f.vorlaeufigesAz,
    gerichtId: g.id,
    gericht: g.name,
    gerichtstyp: g.art,
    einheitId: z.einheitId,
    einheit: einheitById.get(z.einheitId)?.bezeichnung ?? "",
    richterId: z.richterId,
    richter: benutzerById.get(z.richterId)?.name ?? "",
    regelId: z.regelId,
    regelText: regelById.get(z.regelId)?.regelText ?? "",
    regelKurz: regelById.get(z.regelId)?.kurzText,
    klaeger: namen(x.klaeger),
    beklagte: namen(x.beklagte),
    klaegerParteien: x.klaeger,
    beklagteParteien: x.beklagte,
    sachgebiet: x.sachgebiet,
    streitwert: x.streitwertCent / 100,
    streitwertXJustiz:
      x.streitwertXJustizCent !== undefined ? x.streitwertXJustizCent / 100 : undefined,
    eingang: f.eingang.eingangAm,
    uebermittlungsweg: f.eingang.uebermittlungsweg,
    kostenvorschuss: f.eingang.kostenvorschuss,
    geprueftAm: f.erwartet.auswertung.geprueftAm,
    klageschriftId: ks.id,
    klageschrift: ks.text ?? "",
    anlagen: f.eingang.dokumente
      .filter((d) => d.typ === "anlage")
      .map((d) => {
        const [bez, ...rest] = d.name.split(" ");
        return { id: d.id, bezeichnung: bez ?? d.name, titel: rest.join(" "), seiten: d.seiten };
      }),
    xjustiz: Object.entries(f.erwartet.xjustizFelder).map(([label, wert]) => ({
      label,
      wert,
      abweichung: f.erwartet.xjustizAbweichungen.includes(label),
    })),
    xml: f.eingang.xjustizXml,
    befunde: Object.fromEntries(
      ergebnisse.map((e) => [
        e.merkmalId,
        {
          status: e.status,
          begruendung: e.text,
          relevanz: e.relevanz,
          grundlage: e.grundlage,
          fundstelle: e.fundstellen[0]?.zitat,
          fundstellen: e.fundstellen.map((fs) => fs.zitat),
          dokumentId: e.fundstellen[0]?.dokumentId,
          verweisAz: e.verweisAz,
        },
      ]),
    ),
    anzahlAusgewertet: ergebnisse.length,
    anzahlHinweise: ergebnisse.filter((e) =>
      ["mangel", "pruefen", "offen"].includes(e.status),
    ).length,
    nurSimulation: f.nurSimulation,
  };
});
const vorschlaege = new Map(seed.faelle.map((f) => [f.id, f.erwartet.formulierungsvorschlag]));

function alsNutzer(b: Seed["benutzer"][number]): Nutzer {
  const einheiten = b.einheitIds.map((id) => einheitById.get(id)!).filter(Boolean);
  const gericht = gerichtById.get(einheiten[0]?.gerichtId ?? "");
  return {
    id: b.id,
    kennung: b.kennung,
    name: b.name,
    amtsbezeichnung: b.amtsbezeichnung,
    gerichtId: gericht?.id ?? "",
    gericht: gericht?.name ?? "",
    einheiten: einheiten.map((e) => ({ id: e.id, bezeichnung: e.bezeichnung })),
  };
}

// ---------- Services ----------

export const AuthService = {
  /** GET /auth/demo-konten */
  demoKonten(): DemoKonto[] {
    return seed.benutzer.filter((b) => b.demoKonto).map(alsNutzer);
  },
  /** POST /auth/login – im Mock: jede Kennung aus der Seed-Datei, beliebiges Passwort */
  anmelden(kennung: string): Nutzer | null {
    const k = kennung.trim().toLowerCase();
    const b = seed.benutzer.find((x) => x.kennung.toLowerCase() === k || x.id === k);
    return b ? alsNutzer(b) : null;
  },
  /** GET /me */
  me(benutzerId: string | null): Nutzer | null {
    const b = seed.benutzer.find((x) => x.id === benutzerId);
    return b ? alsNutzer(b) : null;
  },
};

export const FallService = {
  /** GET /faelle – nur Fälle der Einheiten des Kontos */
  faelle(benutzerId: string | null): Fall[] {
    const me = AuthService.me(benutzerId);
    if (!me) return [];
    const ids = new Set(me.einheiten.map((e) => e.id));
    return faelle.filter((f) => ids.has(f.einheitId));
  },
  /** GET /faelle/:id */
  fall(id: string): Fall | undefined {
    return faelle.find((f) => f.id === id);
  },
  /** Mock: alle simulierbaren EGVP-Eingänge des Kontos */
  simulationsFaelle(benutzerId: string | null): Fall[] {
    return FallService.faelle(benutzerId).filter((f) => f.nurSimulation);
  },
  /** POST /faelle/{id}/formulierungsvorschlag – im Mock aus erwartet.formulierungsvorschlag */
  formulierungsvorschlag(id: string, _hinweisIds: string[]): { text: string } {
    return { text: vorschlaege.get(id) ?? "" };
  },
};

export const PruefService = {
  /** GET /merkmale */
  checkliste(): Pruefpunkt[] {
    return checkliste;
  },
  aktive(): Pruefpunkt[] {
    return checkliste.filter((p) => aktiveIds.has(p.id));
  },
  merkmal(id: string): Pruefpunkt | undefined {
    return checkliste.find((p) => p.id === id);
  },
};

export const GvpService = {
  /** GET /gvp/einheiten */
  spruchkoerper(): Spruchkoerper[] {
    return spruchkoerper;
  },
  einheit(id: string): Spruchkoerper | undefined {
    return spruchkoerper.find((s) => s.id === id);
  },
  regeln() {
    return seed.gvpRegeln;
  },
};

function alsRegisterEintrag(v: Seed["verfahrensregister"][number]): VerfahrensregisterEintrag {
  return {
    aktenzeichen: v.az,
    gerichtId: v.gerichtId,
    gericht: gerichtById.get(v.gerichtId)?.name ?? "",
    parteien: v.parteien,
    status: v.status,
    zugestelltAm: v.zugestelltAm,
  };
}

export const RegisterService = {
  /** GET /verfahrensregister */
  eintraege(): VerfahrensregisterEintrag[] {
    return seed.verfahrensregister.map(alsRegisterEintrag);
  },
  /** GET /verfahrensregister/{az} */
  eintrag(az: string): VerfahrensregisterEintrag | undefined {
    const v = seed.verfahrensregister.find((x) => x.az === az);
    return v ? alsRegisterEintrag(v) : undefined;
  },
};

export const MetaService = {
  meta() {
    return seed.meta;
  },
};
