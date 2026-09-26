import { Info } from "lucide-react";
import { useState } from "react";

import {
  QuelleBadge,
  StatusChip,
  StatusIcon,
} from "@/components/StatusAnzeige";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  aktivePruefpunkte,
  checkliste,
  kategorien,
  statusLabel,
  type PruefStatus,
} from "@/data/checklist";
import type { Fall } from "@/data/faelle";
import { spruchkoerperById } from "@/data/gvp";
import { useDemo } from "@/context/DemoContext";
import { datumZeit } from "@/lib/format";
import type { Bilanz, Pruefergebnis } from "@/lib/pruefung";
import { oertlicheZustaendigkeit, sachlicheZustaendigkeit } from "@/lib/zustaendigkeit";
import { cn } from "@/lib/utils";

interface Props {
  fall: Fall;
  ergebnisse: Pruefergebnis[];
  bilanz: Bilanz;
  aktiverPunkt: string | null;
  onImDokumentZeigen: (punktId: string) => void;
}

const auffaellig = (s: PruefStatus) =>
  s === "mangel" || s === "pruefen" || s === "offen";

export function PruefDashboard({
  fall,
  ergebnisse,
  bilanz,
  aktiverPunkt,
  onImDokumentZeigen,
}: Props) {
  const { zustand, bewerten } = useDemo();
  const [nurAuffaellige, setNurAuffaellige] = useState(true);
  const [alleHundert, setAlleHundert] = useState(false);
  const z = zustand(fall.id);

  const sachlich = sachlicheZustaendigkeit(fall.streitwert, fall.sachgebiet);
  const oertlich = oertlicheZustaendigkeit(fall.ortBeklagte, fall.gerichtstyp);
  const sk = spruchkoerperById(fall.spruchkoerperId);
  const sachlichBefund = ergebnisse.find((e) => e.punkt.id === "m-008")!;
  const oertlichBefund = ergebnisse.find((e) => e.punkt.id === "m-009")!;

  const kopfText =
    bilanz.gesamtStatus === "ok"
      ? "Keine Beanstandungen"
      : [
          bilanz.mangel > 0
            ? `${bilanz.mangel} ${bilanz.mangel === 1 ? "Mangel" : "Mängel"}`
            : null,
          bilanz.pruefen > 0 ? `${bilanz.pruefen} Punkt bitte prüfen` : null,
          bilanz.offen > 0 ? `${bilanz.offen} Punkt offen` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto border-r border-border bg-surface p-5">
      <section>
        <div className="flex items-start gap-2">
          <StatusIcon
            status={
              bilanz.gesamtStatus === "ok"
                ? "erfuellt"
                : bilanz.gesamtStatus === "err"
                  ? "mangel"
                  : "pruefen"
            }
            className="mt-1 size-6"
          />
          <div>
            <h3
              className={cn(
                "text-lg font-semibold",
                bilanz.gesamtStatus === "ok" && "text-ok",
                bilanz.gesamtStatus === "warn" && "text-warn",
                bilanz.gesamtStatus === "err" && "text-err",
              )}
            >
              {kopfText}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatisch geprüft am {datumZeit(fall.geprueftAm)} · {checkliste.length}{" "}
              Prüfpunkte, davon {aktivePruefpunkte.length} aktiv
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-sm font-semibold">Zuständigkeit</h4>
        <ul className="divide-y divide-border rounded border border-border">
          <li className="flex gap-2 p-3">
            <StatusIcon status={sachlichBefund.status} className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Sachlich</p>
              <p>
                {sachlichBefund.status === "mangel"
                  ? sachlichBefund.begruendung
                  : `${sachlich.satz} (${sachlich.norm})`}
              </p>
            </div>
          </li>
          <li className="flex gap-2 p-3">
            <StatusIcon status={oertlichBefund.status} className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Örtlich</p>
              <p>
                {oertlichBefund.status === "mangel"
                  ? oertlichBefund.begruendung
                  : `${oertlich.satz} (${oertlich.norm})`}
              </p>
            </div>
          </li>
          <li className="flex gap-2 p-3">
            <StatusIcon status="erfuellt" className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Intern</p>
              <p>
                {sk?.bezeichnung} nach {sk?.regel.split(":")[0]}
              </p>
            </div>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Feste Regeln wenden Gesetz und Geschäftsverteilungsplan an. Keine
          KI-Entscheidung.
        </p>
      </section>

      <section>
        <div className="mb-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={nurAuffaellige}
              onCheckedChange={setNurAuffaellige}
              aria-label="Nur Auffälligkeiten anzeigen"
            />
            Nur Auffälligkeiten anzeigen
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={alleHundert}
              onCheckedChange={setAlleHundert}
              aria-label="Alle 100 Prüfpunkte anzeigen"
            />
            Alle {checkliste.length} Prüfpunkte anzeigen
          </label>
        </div>

        <Accordion
          type="multiple"
          defaultValue={kategorien.filter((k) =>
            ergebnisse.some((e) => e.punkt.kategorie === k && auffaellig(e.status)),
          )}
        >
          {kategorien.map((kategorie) => {
            const inKategorie = ergebnisse.filter(
              (e) => e.punkt.kategorie === kategorie,
            );
            const platzhalter = alleHundert
              ? checkliste.filter((p) => p.platzhalter && p.kategorie === kategorie)
              : [];
            const sichtbar = nurAuffaellige
              ? inKategorie.filter((e) => auffaellig(e.status))
              : inKategorie;
            if (sichtbar.length === 0 && platzhalter.length === 0) return null;
            const anzahlAuffaellig = inKategorie.filter((e) =>
              auffaellig(e.status),
            ).length;

            return (
              <AccordionItem key={kategorie} value={kategorie}>
                <AccordionTrigger className="text-sm">
                  <span className="flex w-full items-center justify-between gap-3 pr-2">
                    <span className="text-left font-medium">{kategorie}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {anzahlAuffaellig > 0
                        ? `${anzahlAuffaellig} auffällig · `
                        : ""}
                      {inKategorie.length + platzhalter.length} Punkte
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {sichtbar.map((e) => (
                      <PunktZeile
                        key={e.punkt.id}
                        ergebnis={e}
                        hervorgehoben={aktiverPunkt === e.punkt.id}
                        eigeneBewertung={z.eigene[e.punkt.id]?.status}
                        notiz={z.eigene[e.punkt.id]?.notiz}
                        onBewerten={(status, notiz) =>
                          bewerten(fall.id, e.punkt.id, status ? { status, notiz } : null)
                        }
                        onImDokumentZeigen={() => onImDokumentZeigen(e.punkt.id)}
                      />
                    ))}
                    {platzhalter.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded px-2 py-2 text-sm text-muted-foreground opacity-60"
                      >
                        <StatusIcon status="nicht_anwendbar" />
                        <span>
                          Nr. {p.nr} · {p.titel}
                        </span>
                        <span className="ml-auto text-xs">In Vorbereitung</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      <section>
        <h4 className="mb-2 text-sm font-semibold">Verlauf</h4>
        <ol className="space-y-2 text-xs text-muted-foreground">
          {z.verlauf.map((v, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 tabular-nums">{datumZeit(v.zeit)}</span>
              <span>{v.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function PunktZeile({
  ergebnis,
  hervorgehoben,
  eigeneBewertung,
  notiz,
  onBewerten,
  onImDokumentZeigen,
}: {
  ergebnis: Pruefergebnis;
  hervorgehoben: boolean;
  eigeneBewertung?: PruefStatus | undefined;
  notiz?: string | undefined;
  onBewerten: (status: PruefStatus | null, notiz?: string | undefined) => void;
  onImDokumentZeigen: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const [notizText, setNotizText] = useState(notiz ?? "");

  return (
    <li
      className={cn(
        "rounded border border-transparent transition-colors duration-150",
        hervorgehoben && "border-primary bg-accent",
      )}
    >
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
      >
        <StatusIcon status={ergebnis.status} className="mt-0.5" />
        <span className="flex-1">
          <span className="font-medium">
            Nr. {ergebnis.punkt.nr} · {ergebnis.punkt.titel}
          </span>
          <span className="block text-xs text-muted-foreground">
            {ergebnis.punkt.norm} · {statusLabel[ergebnis.status]}
            {ergebnis.eigen ? " · Eigene Bewertung" : ""}
          </span>
        </span>
        <QuelleBadge quelle={ergebnis.punkt.quelle} />
      </button>

      {offen ? (
        <div className="space-y-3 border-t border-border px-3 py-3 text-sm">
          <p>{ergebnis.begruendung}</p>
          {ergebnis.fundstelle ? (
            <blockquote className="border-l-2 border-border pl-3 font-serif text-[15px] text-muted-foreground">
              „{ergebnis.fundstelle}“
            </blockquote>
          ) : null}
          {ergebnis.fundstelle ? (
            <Button variant="outline" size="sm" onClick={onImDokumentZeigen}>
              Im Dokument zeigen
            </Button>
          ) : null}

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Eigene Bewertung
            </p>
            <ToggleGroup
              type="single"
              value={eigeneBewertung ?? ""}
              onValueChange={(v) =>
                onBewerten((v || null) as PruefStatus | null, notizText || undefined)
              }
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="erfuellt">erfüllt</ToggleGroupItem>
              <ToggleGroupItem value="mangel">Mangel</ToggleGroupItem>
              <ToggleGroupItem value="offen">offen</ToggleGroupItem>
            </ToggleGroup>
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Notiz (optional)"
              value={notizText}
              onChange={(e) => setNotizText(e.target.value)}
              onBlur={() =>
                eigeneBewertung
                  ? onBewerten(eigeneBewertung, notizText || undefined)
                  : undefined
              }
            />
            {ergebnis.eigen ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="size-3.5" aria-hidden="true" />
                Ihre Bewertung überschreibt den automatischen Vorschlag (
                {statusLabel[ergebnis.status]}).
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export { StatusChip };
