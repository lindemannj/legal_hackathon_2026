import { createContext, type Context } from "react";

// Eigene, selten geänderte Datei: Hot-Reloads von DemoContext.tsx erzeugen
// so keine neue Context-Instanz und trennen Provider und Nutzer nicht.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as { __klarisDemoCtx?: Context<any> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DemoCtx: Context<any> = (g.__klarisDemoCtx ??= createContext<any>(null));
