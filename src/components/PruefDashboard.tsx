import { FileSearch } from "lucide-react";
import { useState } from "react";

import { StatusChip, StatusIcon } from "@/components/StatusAnzeige";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  kategorien,
  statusLabel,
  vorauswertungHinweis,
  type Fall,
  type PruefStatus,
} from "@/types/domain";
import { RegisterService } from "@/services/mockBackend";
import { useDemo } from "@/context/DemoContext";
import { datum, datumZeit } from "@/lib/format";
import type { Bilanz, Pruefergebnis } from "@/lib/pruefung";
import { cn } from "@/lib/utils";

interface Props {
  fall: Fall;
  ergebnisse: Pruefergebnis[];
  bilanz: Bilanz;
  aktiverPunkt: string | null;
  onImDokumentZeigen: (punktId: string, index: number) => void;
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
  const { zustand } = useDemo();
  const [nurAuffaellige, setNurAuffaellige] = useState(true);
  const z = zustand(fall.id);

  const sachlichBefund = ergebnisse.find((e) => e.punkt.id === "L05")!;
  const oertlichBefund = ergebnisse.find((e) => e.punkt.id === "L06")!;

  const kopfText =
    bilanz.gesamtStatus === "ok"
      ? "Keine Auffälligkeiten"
      : [
          bilanz.mangel > 0
            ? `${bilanz.mangel} ${bilanz.mangel === 1 ? "Auffälligkeit" : "Auffälligkeiten"}`
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
              title={vorauswertungHinweis}
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
              Automatische Vorauswertung am {datumZeit(fall.geprueftAm)} ·{" "}
              {ergebnisse.length} Prüfpunkte
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
{sachlichBefund.begruendung}
              </p>
            </div>
          </li>
          <li className="flex gap-2 p-3">
            <StatusIcon status={oertlichBefund.status} className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Örtlich</p>
              <p>
{oertlichBefund.begruendung}
              </p>
            </div>
          </li>
          <li className="flex gap-2 p-3">
            <StatusIcon status="erfuellt" className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Intern</p>
              <p>
                {fall.einheit} nach {fall.regelText.split(" · ")[0]?.split(":")[0]}
              </p>
            </div>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Feste Regeln wenden Gesetz und Geschäftsverteilungsplan an.
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
            const sichtbar = nurAuffaellige
              ? inKategorie.filter((e) => auffaellig(e.status))
              : inKategorie;
            if (sichtbar.length === 0) return null;
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
                      {inKategorie.length} Punkte
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
                        onImDokumentZeigen={(i) => onImDokumentZeigen(e.punkt.id, i)}
                      />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        <p className="mt-3 text-xs text-muted-foreground">
          Prüfschema nach Prof. Dr. Stephan Lorenz, Normen aktualisiert
        </p>
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
  onImDokumentZeigen: (index: number) => void;
}) {
  const [offen, setOffen] = useState(false);
  const [sprungNr, setSprungNr] = useState<number | null>(null);
  const zeigeSprung = auffaellig(ergebnis.status);
  const anzahl = ergebnis.fundstellen.length;
  function springen() {
    const naechste = sprungNr === null ? 0 : (sprungNr + 1) % anzahl;
    setSprungNr(naechste);
    onImDokumentZeigen(naechste);
  }
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
            {ergebnis.punkt.id} · {ergebnis.punkt.titel}
          </span>
          <span className="block text-xs text-muted-foreground">
            {ergebnis.punkt.norm ? `${ergebnis.punkt.norm} · ` : ""}
            {ergebnis.nurAufRuege
              ? "Nur auf Rüge"
              : ergebnis.eigen
                ? ergebnis.status === "erfuellt"
                  ? "erfüllt"
                  : ergebnis.status === "mangel"
                    ? "nicht erfüllt"
                    : statusLabel[ergebnis.status]
                : statusLabel[ergebnis.status]}
            {ergebnis.eigen ? " · Eigene Bewertung" : ""}
          </span>
        </span>
        <QuelleBadge quelle={ergebnis.punkt.quelle} />
      </button>
      {zeigeSprung ? (
        <div className="flex items-center gap-2 px-2 pb-2 pl-8">
          <span title={anzahl === 0 ? "Keine Fundstelle im Dokument" : undefined}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              disabled={anzahl === 0}
              onClick={springen}
            >
              <FileSearch className="size-3.5" aria-hidden="true" />
              Im Dokument zeigen
            </Button>
          </span>
          {anzahl > 1 && sprungNr !== null ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {sprungNr + 1} von {anzahl}
            </span>
          ) : null}
        </div>
      ) : null}

      {offen ? (
        <div className="space-y-3 border-t border-border px-3 py-3 text-sm">
          <p>{ergebnis.begruendung}</p>
          {ergebnis.fundstellen.map((f, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-border pl-3 font-serif text-[15px] text-muted-foreground"
            >
              „{f}“
            </blockquote>
          ))}
          {ergebnis.verweisAz ? <RegisterVerweis az={ergebnis.verweisAz} /> : null}

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
              <ToggleGroupItem value="mangel">nicht erfüllt</ToggleGroupItem>
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

function RegisterVerweis({ az }: { az: string }) {
  const [offen, setOffen] = useState(false);
  const eintrag = offen ? RegisterService.eintrag(az) : undefined;
  return (
    <div>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOffen((o) => !o)}>
        {offen ? "Registereintrag ausblenden" : `Verfahren ${az} im Register ansehen`}
      </Button>
      {offen ? (
        <div className="mt-2 rounded border border-border bg-muted px-3 py-2 text-xs">
          {eintrag ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Aktenzeichen</dt>
              <dd className="tabular-nums">{eintrag.aktenzeichen}</dd>
              <dt className="text-muted-foreground">Gericht</dt>
              <dd>{eintrag.gericht}</dd>
              <dt className="text-muted-foreground">Parteien</dt>
              <dd>{eintrag.parteien}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {eintrag.status}
                {eintrag.zugestelltAm ? `, zugestellt am ${datum(eintrag.zugestelltAm)}` : ""}
              </dd>
            </dl>
          ) : (
            <p>Kein Eintrag im Verfahrensregister gefunden.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
