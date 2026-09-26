<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Projektstruktur

- Alle Stammdaten liegen ausschließlich in `seed/demo-daten.txt` (Schema `src/types/seed.ts`, Doku `docs/seed-format.md`); nur `src/services/mockBackend.ts` liest sie und bietet API-artige Services — das spätere Backend lädt dieselbe Datei. Keine Namen/Gerichte/Einheiten im Code.
- Der gesamte Demo-Zustand läuft über `src/context/DemoContext.tsx` mit localStorage-Persistenz, damit ein Reload die Demo nicht zurücksetzt.
