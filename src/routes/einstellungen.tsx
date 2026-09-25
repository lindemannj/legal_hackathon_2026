import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { QuelleBadge } from "@/components/StatusAnzeige";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { aktivePruefpunkte } from "@/data/checklist";
import { useDemo } from "@/context/DemoContext";

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [
      { title: "Meine Prüfliste · Klaris" },
      {
        name: "description",
        content:
          "Prüfpunkte der Eingangsprüfung aktivieren, deaktivieren und eigene Punkte ergänzen.",
      },
      { property: "og:title", content: "Meine Prüfliste · Klaris" },
      {
        property: "og:description",
        content: "Sie bestimmen, welche Punkte vorab geprüft werden.",
      },
    ],
  }),
  component: Einstellungen,
});

function Einstellungen() {
  const {
    aktuellerNutzer,
    state,
    togglePruefpunkt,
    eigenenPunktHinzufuegen,
    hydriert,
  } = useDemo();
  const navigate = useNavigate();
  const [titel, setTitel] = useState("");
  const [norm, setNorm] = useState("");

  useEffect(() => {
    if (hydriert && !aktuellerNutzer) navigate({ to: "/" });
  }, [hydriert, aktuellerNutzer, navigate]);

  if (!aktuellerNutzer) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Kopfzeile />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold">Meine Prüfliste</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sie bestimmen, welche Punkte vorab geprüft werden.
        </p>

        <ul className="mt-6 divide-y divide-border rounded border border-border bg-surface">
          {aktivePruefpunkte.map((p) => (
            <li key={p.id} className="flex items-start gap-4 px-4 py-3">
              <Switch
                checked={!state.deaktivierte.includes(p.id)}
                onCheckedChange={() => togglePruefpunkt(p.id)}
                aria-label={`Prüfpunkt ${p.nr} aktivieren`}
              />
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  Nr. {p.nr} · {p.titel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.kategorie} · {p.norm}
                </p>
              </div>
              <QuelleBadge quelle={p.quelle} />
            </li>
          ))}
          {state.eigenePruefpunkte.map((p) => (
            <li key={p.id} className="flex items-start gap-4 px-4 py-3">
              <Switch checked disabled aria-label="Eigener Prüfpunkt" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{p.titel}</p>
                <p className="text-xs text-muted-foreground">{p.norm}</p>
              </div>
              <QuelleBadge quelle="manuell" />
            </li>
          ))}
        </ul>

        <form
          className="mt-6 flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!titel.trim()) return;
            eigenenPunktHinzufuegen(titel, norm || "—");
            setTitel("");
            setNorm("");
          }}
        >
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="titel">Eigener Prüfpunkt</Label>
            <Input
              id="titel"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
            />
          </div>
          <div className="w-48 space-y-1.5">
            <Label htmlFor="norm">Norm</Label>
            <Input id="norm" value={norm} onChange={(e) => setNorm(e.target.value)} />
          </div>
          <Button type="submit">Eigenen Prüfpunkt hinzufügen</Button>
        </form>
      </main>
      <Fusszeile />
    </div>
  );
}
