import { Download, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Fall } from "@/types/domain";
import type { Pruefergebnis } from "@/lib/pruefung";
import { cn } from "@/lib/utils";

interface Props {
  fall: Fall;
  ergebnisse: Pruefergebnis[];
  aktiverPunkt: string | null;
  onMarkerKlick: (punktId: string) => void;
  onPdf: () => void;
}

interface Segment {
  text: string;
  treffer?: Pruefergebnis;
}

function segmentiere(text: string, marken: Pruefergebnis[]): Segment[] {
  const stellen = marken
    .map((m) => ({ m, index: text.indexOf(m.fundstelle!) }))
    .filter((s) => s.index >= 0)
    .sort((a, b) => a.index - b.index);

  const segmente: Segment[] = [];
  let cursor = 0;
  for (const s of stellen) {
    if (s.index < cursor) continue;
    segmente.push({ text: text.slice(cursor, s.index) });
    segmente.push({ text: s.m.fundstelle!, treffer: s.m });
    cursor = s.index + s.m.fundstelle!.length;
  }
  segmente.push({ text: text.slice(cursor) });
  return segmente;
}

export function DokumentAnsicht({
  fall,
  ergebnisse,
  aktiverPunkt,
  onMarkerKlick,
  onPdf,
}: Props) {
  const [zoom, setZoom] = useState(100);
  const [markierungen, setMarkierungen] = useState(true);

  const marken = useMemo(
    () => ergebnisse.filter((e) => e.fundstelle && e.markerNr),
    [ergebnisse],
  );
  const segmente = useMemo(
    () => segmentiere(fall.klageschrift, markierungen ? marken : []),
    [fall.klageschrift, marken, markierungen],
  );

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="klageschrift" className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
          <TabsList>
            <TabsTrigger value="klageschrift">Klageschrift</TabsTrigger>
            <TabsTrigger value="anlagen">Anlagen ({fall.anlagen.length})</TabsTrigger>
            <TabsTrigger value="strukturdaten">Strukturdaten (XJustiz)</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Verkleinern"
                onClick={() => setZoom((z) => Math.max(80, z - 10))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-12 text-center text-sm tabular-nums">{zoom} %</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Vergrößern"
                onClick={() => setZoom((z) => Math.min(140, z + 10))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={markierungen}
                onCheckedChange={setMarkierungen}
                aria-label="Markierungen anzeigen"
              />
              Markierungen anzeigen
            </label>
            <Button variant="ghost" size="sm" onClick={onPdf}>
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </div>

        <TabsContent
          value="klageschrift"
          className="min-h-0 flex-1 overflow-auto bg-background p-6"
        >
          <TooltipProvider delayDuration={200}>
            <article
              className="doc-sheet mx-auto max-w-[820px] rounded-sm border border-border bg-surface px-14 py-12 shadow-sm"
              style={{ fontSize: `${(17 * zoom) / 100}px` }}
            >
              <pre className="doc-sheet whitespace-pre-wrap font-serif">
                {segmente.map((seg, i) =>
                  seg.treffer ? (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <mark
                          id={`marker-${seg.treffer.punkt.id}`}
                          tabIndex={0}
                          role="button"
                          onClick={() => onMarkerKlick(seg.treffer!.punkt.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onMarkerKlick(seg.treffer!.punkt.id);
                            }
                          }}
                          className={cn(
                            "relative cursor-pointer rounded-sm underline decoration-2 underline-offset-4",
                            seg.treffer.status === "mangel"
                              ? "bg-mark-err decoration-err"
                              : "bg-mark-warn decoration-warn",
                            aktiverPunkt === seg.treffer.punkt.id && "mark-flash",
                          )}
                        >
                          <sup className="mr-1 -ml-7 inline-block w-5 rounded bg-neutral-bg text-center text-[11px] font-sans text-muted-foreground">
                            {seg.treffer.markerNr}
                          </sup>
                          {seg.text}
                        </mark>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">
                          Nr. {seg.treffer.punkt.nr} · {seg.treffer.punkt.titel}
                        </p>
                        <p className="mt-1 text-xs">{seg.treffer.begruendung}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </pre>
            </article>
          </TooltipProvider>
        </TabsContent>

        <TabsContent value="anlagen" className="min-h-0 flex-1 overflow-auto p-6">
          <ul className="mx-auto max-w-[680px] divide-y divide-border rounded border border-border bg-surface">
            {fall.anlagen.map((a) => (
              <li
                key={a.bezeichnung}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{a.bezeichnung}</span> · {a.titel}
                </span>
                <span className="text-muted-foreground">
                  {a.seiten} {a.seiten === 1 ? "Seite" : "Seiten"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-3 max-w-[680px] text-xs text-muted-foreground">
            Anlageninhalte sind im Prototyp nicht hinterlegt.
          </p>
        </TabsContent>

        <TabsContent
          value="strukturdaten"
          className="min-h-0 flex-1 overflow-auto p-6"
        >
          <div className="mx-auto max-w-[760px]">
            <table className="w-full border border-border bg-surface text-sm">
              <caption className="sr-only">XJustiz-Datensatz</caption>
              <tbody className="divide-y divide-border">
                {fall.xjustiz.map((f) => (
                  <tr key={f.label} className={f.abweichung ? "bg-warn-bg" : ""}>
                    <th
                      scope="row"
                      className="w-64 px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {f.label}
                    </th>
                    <td className="px-4 py-2">
                      {f.wert}
                      {f.abweichung ? (
                        <span className="ml-2 text-xs font-medium text-warn">
                          Abweichung zur Klageschrift
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Collapsible className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  XML anzeigen
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-3 overflow-auto rounded border border-border bg-muted p-4 text-xs leading-relaxed">
                  {fall.xml}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
