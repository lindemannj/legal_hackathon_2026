import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { aktivePruefpunkte, type PruefStatus } from "@/data/checklist";
import { faelle, type Fall } from "@/data/faelle";
import { spruchkoerperById } from "@/data/gvp";
import type { EigeneBewertung } from "@/lib/pruefung";

export const PRODUKTNAME = "Klaris";

export interface Nutzer {
  id: string;
  name: string;
  amtsbezeichnung: string;
  gericht: string;
  spruchkoerperId: string;
  spruchkoerperKurz: string;
}

export const nutzer: Nutzer[] = [
  {
    id: "hoffmann",
    name: "Dr. Julia Hoffmann",
    amtsbezeichnung: "Richterin am Amtsgericht",
    gericht: "Amtsgericht Köln",
    spruchkoerperId: "ag-koeln-142",
    spruchkoerperKurz: "Zivilabteilung 142",
  },
  {
    id: "wendt",
    name: "Tobias Wendt",
    amtsbezeichnung: "Richter am Landgericht",
    gericht: "Landgericht Köln",
    spruchkoerperId: "lg-koeln-5",
    spruchkoerperKurz: "5. Zivilkammer",
  },
];

export type FallAblage = "eingang" | "beanstandet" | "erledigt";

export interface VerlaufEintrag {
  zeit: string;
  text: string;
}

export interface Beanstandung {
  maengel: string[];
  massnahme: string;
  fristWochen: number;
  fristBis: string;
  text: string;
}

export interface FallZustand {
  ablage: FallAblage;
  sichtbar: boolean;
  eigene: Record<string, EigeneBewertung>;
  verlauf: VerlaufEintrag[];
  verfahrensart?: string;
  beanstandung?: Beanstandung;
}

export interface DemoState {
  nutzerId: string | null;
  faelle: Record<string, FallZustand>;
  deaktivierte: string[];
  eigenePruefpunkte: { id: string; titel: string; norm: string }[];
}

function jetzt(): string {
  return new Date().toISOString();
}

function startZustand(fall: Fall): FallZustand {
  return {
    ablage: "eingang",
    sichtbar: !fall.nurSimulation,
    eigene: {},
    verlauf: [
      { zeit: fall.eingang, text: `Eingang über ${fall.uebermittlungsweg}` },
      {
        zeit: fall.eingang,
        text: `Zuweisung nach Geschäftsverteilungsplan an ${spruchkoerperById(fall.spruchkoerperId)?.bezeichnung ?? ""}`,
      },
      {
        zeit: fall.geprueftAm,
        text: `Automatische Vorprüfung, ${aktivePruefpunkte.length} Prüfpunkte ausgewertet`,
      },
    ],
  };
}

function initialState(): DemoState {
  return {
    nutzerId: null,
    faelle: Object.fromEntries(faelle.map((f) => [f.id, startZustand(f)])),
    deaktivierte: [],
    eigenePruefpunkte: [],
  };
}

const STORAGE_KEY = "klaris-demo-v1";

interface DemoContextValue {
  state: DemoState;
  aktuellerNutzer: Nutzer | null;
  anmelden: (id: string) => void;
  abmelden: () => void;
  zuruecksetzen: () => void;
  meineFaelle: (ablage: FallAblage) => Fall[];
  zustand: (fallId: string) => FallZustand;
  bewerten: (fallId: string, punktId: string, bewertung: EigeneBewertung | null) => void;
  zustellungVerfuegen: (fallId: string, verfahrensart: string) => void;
  beanstanden: (fallId: string, beanstandung: Beanstandung) => void;
  rueckgaengig: (fallId: string) => void;
  simulierenEingang: () => string | null;
  togglePruefpunkt: (punktId: string) => void;
  eigenenPunktHinzufuegen: (titel: string, norm: string) => void;
  hydriert: boolean;
}

const Ctx = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => initialState());
  const [hydriert, setHydriert] = useState(false);

  useEffect(() => {
    try {
      const roh = window.localStorage.getItem(STORAGE_KEY);
      if (roh) setState({ ...initialState(), ...(JSON.parse(roh) as DemoState) });
    } catch {
      /* Demo-Zustand ignorieren */
    }
    setHydriert(true);
  }, []);

  useEffect(() => {
    if (!hydriert) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydriert]);

  const aktuellerNutzer = useMemo(
    () => nutzer.find((n) => n.id === state.nutzerId) ?? null,
    [state.nutzerId],
  );

  const zustand = useCallback(
    (fallId: string): FallZustand => {
      const fall = faelle.find((f) => f.id === fallId)!;
      return state.faelle[fallId] ?? startZustand(fall);
    },
    [state.faelle],
  );

  const patch = useCallback((fallId: string, änderung: Partial<FallZustand>) => {
    setState((s) => {
      const fall = faelle.find((f) => f.id === fallId)!;
      const alt = s.faelle[fallId] ?? startZustand(fall);
      return { ...s, faelle: { ...s.faelle, [fallId]: { ...alt, ...änderung } } };
    });
  }, []);

  const value: DemoContextValue = {
    state,
    aktuellerNutzer,
    hydriert,
    anmelden: (id) => setState((s) => ({ ...s, nutzerId: id })),
    abmelden: () => setState((s) => ({ ...s, nutzerId: null })),
    zuruecksetzen: () =>
      setState((s) => ({ ...initialState(), nutzerId: s.nutzerId })),
    meineFaelle: (ablage) => {
      if (!aktuellerNutzer) return [];
      return faelle
        .filter((f) => f.spruchkoerperId === aktuellerNutzer.spruchkoerperId)
        .filter((f) => {
          const z = zustand(f.id);
          return z.sichtbar && z.ablage === ablage;
        })
        .sort((a, b) => b.eingang.localeCompare(a.eingang));
    },
    zustand,
    bewerten: (fallId, punktId, bewertung) => {
      const z = zustand(fallId);
      const eigene = { ...z.eigene };
      const titel =
        aktivePruefpunkte.find((p) => p.id === punktId)?.titel ?? punktId;
      if (bewertung) eigene[punktId] = bewertung;
      else delete eigene[punktId];
      patch(fallId, {
        eigene,
        verlauf: [
          ...z.verlauf,
          {
            zeit: jetzt(),
            text: bewertung
              ? `Eigene Bewertung zu „${titel}“: ${labelStatus(bewertung.status)}`
              : `Eigene Bewertung zu „${titel}“ zurückgenommen`,
          },
        ],
      });
    },
    zustellungVerfuegen: (fallId, verfahrensart) => {
      const z = zustand(fallId);
      patch(fallId, {
        ablage: "erledigt",
        verfahrensart,
        verlauf: [
          ...z.verlauf,
          {
            zeit: jetzt(),
            text: `Zulässigkeit bestätigt, Zustellung verfügt (${verfahrensart}), an eAkte übergeben (simuliert)`,
          },
        ],
      });
    },
    beanstanden: (fallId, beanstandung) => {
      const z = zustand(fallId);
      patch(fallId, {
        ablage: "beanstandet",
        beanstandung,
        verlauf: [
          ...z.verlauf,
          {
            zeit: jetzt(),
            text: `Beanstandung verfügt: ${beanstandung.massnahme}, Frist bis ${beanstandung.fristBis}`,
          },
        ],
      });
    },
    rueckgaengig: (fallId) => {
      const z = zustand(fallId);
      patch(fallId, {
        ablage: "eingang",
        beanstandung: undefined,
        verfahrensart: undefined,
        verlauf: [...z.verlauf, { zeit: jetzt(), text: "Verfügung zurückgenommen" }],
      });
    },
    simulierenEingang: () => {
      const ziel = faelle.find((f) => f.nurSimulation);
      if (!ziel) return null;
      setState((s) => ({
        ...s,
        faelle: {
          ...s.faelle,
          [ziel.id]: { ...startZustand(ziel), sichtbar: true },
        },
      }));
      return ziel.id;
    },
    togglePruefpunkt: (punktId) =>
      setState((s) => ({
        ...s,
        deaktivierte: s.deaktivierte.includes(punktId)
          ? s.deaktivierte.filter((p) => p !== punktId)
          : [...s.deaktivierte, punktId],
      })),
    eigenenPunktHinzufuegen: (titel, norm) =>
      setState((s) => ({
        ...s,
        eigenePruefpunkte: [
          ...s.eigenePruefpunkte,
          { id: `eigen-${s.eigenePruefpunkte.length + 1}`, titel, norm },
        ],
      })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function labelStatus(s: PruefStatus): string {
  return s === "erfuellt" ? "erfüllt" : s === "mangel" ? "Mangel" : "offen";
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo muss innerhalb von DemoProvider genutzt werden");
  return ctx;
}
