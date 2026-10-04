# Legal Hackathon 2026 – JustKlaris

JustKlaris is a clickable prototype that shows how German civil courts could pre-check incoming lawsuits (*Eingangsprüfung*).

When a new claim arrives (simulated EGVP inbox), the prototype:

- extracts the key data from the statement of claim: parties, subject matter, amount in dispute
- compares it with the structured XJustiz data and flags differences
- assigns the case to the responsible department and judge based on the court's allocation plan (*Geschäftsverteilungsplan*)
- runs a checklist of 16 admissibility criteria and shows each finding with the matching quote from the documents
- lets the judge either confirm admissibility and order service, or raise objections with a suggested wording

The UI is in German. Everything runs in the browser. There is no backend: all data comes from a single seed file, and the demo state is stored in the browser's `localStorage`.

## Run locally

Requirements: [Node.js](https://nodejs.org/) 22 or newer.

```sh
npm install
npm run dev
```

Then open http://localhost:8080 and sign in with one of the demo accounts on the login page (any password works).

To reset the demo, clear the site data in your browser (DevTools → Application → Storage → Clear site data).

## Project structure

| Path | Content |
|---|---|
| `seed/demo-daten.txt` | All demo data (courts, users, allocation rules, cases) as JSON |
| `src/services/mockBackend.ts` | Mock service, the only place that reads the seed file |
| `src/context/DemoContext.tsx` | Demo state, persisted in `localStorage` |
| `src/routes/` | Pages: login, inbox (`/eingang`), checklist settings (`/einstellungen`) |
| `docs/` | Seed format and draft API contract (German) |

Built with TanStack Start, React, Tailwind CSS and shadcn/ui.
