import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DemoCtx } from "./demoCtx";
import type { EigeneBewertung } from "@/lib/pruefung";
import {
  AuthService,
  FallService,
  PruefService,
} from "@/services/mockBackend";
import type { Fall, Nutzer, PruefStatus } from "@/types/domain";

export const PRODUKTNAME = "Klaris";

export type { Nutzer };

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
  version: number;
  ablage: FallAblage;
  sichtbar: boolean;
  eigene: Record<string, EigeneBewertung>;
  verlauf: VerlaufEintrag[];
  verfahrensart?: string | undefined;
  beanstandung?: Beanstandung | undefined;
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
    version: 1,
    ablage: "eingang",
    sichtbar: !fall.nurSimulation,
    eigene: {},
    verlauf: [
      { zeit: fall.eingang, text: `Eingang über ${fall.uebermittlungsweg}` },
      {
        zeit: fall.eingang,
        text: `Zuweisung nach Geschäftsverteilungsplan an ${fall.einheit}`,
      },
      {
        zeit: fall.geprueftAm,
        text: `Automatische Vorprüfung, ${fall.anzahlAusgewertet} Prüfpunkte ausgewertet`,
      },
    ],
  };
}

function initialState(): DemoState {
  return {
    nutzerId: null,
    faelle: {},
    deaktivierte: [],
    eigenePruefpunkte: [],
  };
}

const STORAGE_KEY = "klaris-demo-v3";

interface DemoContextValue {
  state: DemoState;
  aktuellerNutzer: Nutzer | null;
  anmelden: (kennung: string) => boolean;
  abmelden: () => void;
  zuruecksetzen: () => void;
  meineFaelle: (ablage: FallAblage) => Fall[];
  zustand: (fallId: string) => FallZustand;
  bewerten: (fallId: string, punktId: string, bewertung: EigeneBewertung | null) => void;
  zustellungVerfuegen: (fallId: string, verfahrensart: string) => void;
  beanstanden: (fallId: string, beanstandung: Beanstandung) => void;
  rueckgaengig: (fallId: string) => void;
  simulierenEingang: () => string | null;
  simulationVerfuegbar: boolean;
  togglePruefpunkt: (punktId: string) => void;
  eigenenPunktHinzufuegen: (titel: string, norm: string) => void;
  hydriert: boolean;
}

const Ctx = DemoCtx as React.Context<DemoContextValue | null>;

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
    () => AuthService.me(state.nutzerId),
    [state.nutzerId],
  );

  const zustand = useCallback(
    (fallId: string): FallZustand => {
      const fall = FallService.fall(fallId)!;
      return state.faelle[fallId] ?? startZustand(fall);
    },
    [state.faelle],
  );

  const patch = useCallback((fallId: string, änderung: Partial<FallZustand>) => {
    setState((s) => {
      const fall = FallService.fall(fallId)!;
      const alt = s.faelle[fallId] ?? startZustand(fall);
      return { ...s, faelle: { ...s.faelle, [fallId]: { ...alt, ...änderung, version: (alt.version ?? 1) + 1 } } };
    });
  }, []);

  const value: DemoContextValue = {
    state,
    aktuellerNutzer,
    hydriert,
    anmelden: (kennung) => {
      const n = AuthService.anmelden(kennung);
      if (!n) return false;
      setState((s) => ({ ...s, nutzerId: n.id }));
      return true;
    },
    abmelden: () => setState((s) => ({ ...s, nutzerId: null })),
    zuruecksetzen: () =>
      setState((s) => ({ ...initialState(), nutzerId: s.nutzerId })),
    meineFaelle: (ablage) => {
      return FallService.faelle(state.nutzerId)
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
        PruefService.merkmal(punktId)?.titel ?? punktId;
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
    simulationVerfuegbar: FallService.simulationsFaelle(state.nutzerId).some(
      (f) => !zustand(f.id).sichtbar,
    ),
    simulierenEingang: () => {
      const ziel = FallService.simulationsFaelle(state.nutzerId).find(
        (f) => !zustand(f.id).sichtbar,
      );
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
