import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FallKarte } from "@/components/FallKarte";
import { Fusszeile, Kopfzeile } from "@/components/Kopfzeile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDemo, type FallAblage } from "@/context/DemoContext";
import { bilanz as berechneBilanz, pruefergebnisse } from "@/lib/pruefung";

export const Route = createFileRoute("/eingang")({
  head: () => ({
    meta: [
      { title: "Posteingang · Klaris Eingangsprüfung" },
      {
        name: "description",
        content:
          "Geprüfte Klageeingänge mit Prüf-Dashboard, markierten Fundstellen und Entscheidung über Zustellung oder Beanstandung.",
      },
      { property: "og:title", content: "Posteingang · Klaris Eingangsprüfung" },
      {
        property: "og:description",
        content:
          "Jede Klage kommt bereits vorgeprüft an: Zuweisung nach Geschäftsverteilungsplan, Zulässigkeitsprüfung, Entscheidung durch den Menschen.",
      },
    ],
  }),
  component: Posteingang,
});

const schritte = [
  "EGVP-Nachricht empfangen",
  "XJustiz-Datensatz gelesen",
  "Geschäftsverteilung angewendet",
  "Zuständigkeit geprüft",
  "25 Prüfpunkte ausgewertet",
];

function Posteingang() {
  const { aktuellerNutzer, meineFaelle, zustand, simulierenEingang, hydriert } =
    useDemo();
  const navigate = useNavigate();

  const [ablage, setAblage] = useState<FallAblage>("eingang");
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("alle");
  const [offenerFall, setOffenerFall] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<number | null>(null);
  const [hilfeOffen, setHilfeOffen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydriert && !aktuellerNutzer) navigate({ to: "/" });
  }, [hydriert, aktuellerNutzer, navigate]);

  const eingang = meineFaelle("eingang");
  const beanstandet = meineFaelle("beanstandet");
  const erledigt = meineFaelle("erledigt");
  const basis = ablage === "eingang" ? eingang : ablage === "beanstandet" ? beanstandet : erledigt;

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return basis
      .filter(
        (f) =>
          !q ||
          f.aktenzeichen.toLowerCase().includes(q) ||
          f.klaeger.toLowerCase().includes(q) ||
          f.beklagte.toLowerCase().includes(q),
      )
      .filter((f) => {
        if (filter === "alle") return true;
        const b = berechneBilanz(pruefergebnisse(f));
        return filter === "auffaellig"
          ? b.gesamtStatus !== "ok"
          : b.gesamtStatus === "ok";
      });
  }, [basis, suche, filter, zustand]);

  const simulieren = useCallback(() => {
    setAblage("eingang");
    setSimulation(0);
    const timer: number[] = [];
    schritte.forEach((_, i) => {
      timer.push(
        window.setTimeout(() => setSimulation(i + 1), (i + 1) * 600),
      );
    });
    window.setTimeout(() => {
      setSimulation(null);
      const id = simulierenEingang();
      if (id) setOffenerFall(null);
    }, 3200);
  }, [simulierenEingang]);

  // Tastaturkürzel
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const ziel = e.target as HTMLElement | null;
      if (
        ziel &&
        (ziel.tagName === "INPUT" ||
          ziel.tagName === "TEXTAREA" ||
          ziel.isContentEditable)
      )
        return;
      const index = liste.findIndex((f) => f.id === offenerFall);
      if (e.key === "j" || e.key === "J") {
        const next = liste[Math.min(liste.length - 1, index + 1)];
        if (next) setOffenerFall(next.id);
      } else if (e.key === "k" || e.key === "K") {
        const prev = liste[Math.max(0, index - 1)];
        if (prev) setOffenerFall(prev.id);
      } else if (e.key === "Enter" && liste[0]) {
        setOffenerFall((o) => (o ? null : liste[0]!.id));
      } else if (e.key === "?") {
        setHilfeOffen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [liste, offenerFall]);

  if (!aktuellerNutzer) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Kopfzeile onSimulieren={simulieren} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-6" ref={container}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs value={ablage} onValueChange={(v) => setAblage(v as FallAblage)}>
            <TabsList>
              <TabsTrigger value="eingang">Posteingang ({eingang.length})</TabsTrigger>
              <TabsTrigger value="beanstandet">
                Beanstandet ({beanstandet.length})
              </TabsTrigger>
              <TabsTrigger value="erledigt">Erledigt ({erledigt.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="w-64 pl-9"
                placeholder="Aktenzeichen oder Partei"
                aria-label="Suche nach Aktenzeichen oder Partei"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
              />
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              value={filter}
              onValueChange={(v) => v && setFilter(v)}
            >
              <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
              <ToggleGroupItem value="auffaellig">Mit Auffälligkeiten</ToggleGroupItem>
              <ToggleGroupItem value="ohne">Ohne Auffälligkeit</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {simulation !== null ? (
            <article className="rounded border border-border bg-surface p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Neuer Eingang wird geprüft
              </h2>
              <ol className="mt-3 space-y-1.5 text-sm">
                {schritte.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    {i < simulation ? (
                      <CheckCircle2 className="size-4 text-ok" aria-hidden="true" />
                    ) : (
                      <span
                        className="size-4 rounded-full border border-border"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        i < simulation ? "" : "text-muted-foreground"
                      }
                    >
                      {s}
                      {i < simulation ? " · erledigt" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          ) : null}

          {liste.map((fall) => (
            <FallKarte
              key={fall.id}
              fall={fall}
              offen={offenerFall === fall.id}
              onToggle={() =>
                setOffenerFall((o) => (o === fall.id ? null : fall.id))
              }
            />
          ))}

          {liste.length === 0 && simulation === null ? (
            <p className="rounded border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              Keine Verfahren in dieser Ansicht.
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <Button variant="ghost" size="sm" onClick={() => setHilfeOffen(true)}>
            Tastaturkürzel anzeigen (?)
          </Button>
        </div>
      </main>

      <Dialog open={hilfeOffen} onOpenChange={setHilfeOffen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tastaturkürzel</DialogTitle>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            {[
              ["J", "nächster Fall"],
              ["K", "vorheriger Fall"],
              ["Enter", "Fall auf- und zuklappen"],
              ["?", "diese Übersicht"],
            ].map(([taste, text]) => (
              <div key={taste} className="flex gap-4">
                <dt className="w-20 font-mono font-medium">{taste}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>

      <Fusszeile />
    </div>
  );
}
