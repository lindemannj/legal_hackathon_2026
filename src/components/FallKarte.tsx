import { ChevronDown, ChevronUp, Download, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DokumentAnsicht } from "@/components/DokumentAnsicht";
import { PruefDashboard } from "@/components/PruefDashboard";
import {
  BeanstandungDialog,
  ZustellungDialog,
} from "@/components/EntscheidungsDialoge";
import { StatusChip } from "@/components/StatusAnzeige";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDemo } from "@/context/DemoContext";
import type { Fall } from "@/types/domain";
import { GvpService } from "@/services/mockBackend";
const spruchkoerperById = (id: string) => GvpService.einheit(id);
import { eingangLabel, euro } from "@/lib/format";
import { exportiereMarkiertesPdf } from "@/lib/pdfExport";
import { bilanz as berechneBilanz, pruefergebnisse } from "@/lib/pruefung";
import { cn } from "@/lib/utils";

interface Props {
  fall: Fall;
  offen: boolean;
  onToggle: () => void;
  registerRef?: (el: HTMLElement | null) => void;
}

const sachgebietLabel: Record<string, string> = {
  allgemein: "Allgemeine Zivilsache",
  wohnraummiete: "Wohnraummiete",
  nachbarrecht: "Nachbarrecht",
  heilbehandlung: "Heilbehandlung",
  veroeffentlichung: "Veröffentlichung",
  vergabe: "Vergabesache",
};

export function FallKarte({ fall, offen, onToggle, registerRef }: Props) {
  const { zustand, zustellungVerfuegen, beanstanden, rueckgaengig } = useDemo();
  const z = zustand(fall.id);
  const ergebnisse = useMemo(
    () => pruefergebnisse(fall, z.eigene),
    [fall, z.eigene],
  );
  const bilanz = useMemo(() => berechneBilanz(ergebnisse), [ergebnisse]);
  const sk = spruchkoerperById(fall.spruchkoerperId);

  const [aktiverPunkt, setAktiverPunkt] = useState<string | null>(null);
  const [zustellungOffen, setZustellungOffen] = useState(false);
  const [beanstandungOffen, setBeanstandungOffen] = useState(false);
  const karte = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (offen && karte.current) {
      karte.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [offen]);

  const streifen =
    bilanz.gesamtStatus === "ok"
      ? "bg-ok"
      : bilanz.gesamtStatus === "warn"
        ? "bg-warn"
        : "bg-err";

  function imDokumentZeigen(punktId: string) {
    setAktiverPunkt(punktId);
    const el = document.getElementById(`marker-${punktId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setAktiverPunkt(null), 1500);
  }

  return (
    <article
      ref={(el) => {
        karte.current = el;
        registerRef?.(el);
      }}
      data-fall-id={fall.id}
      className="relative overflow-hidden rounded border border-border bg-surface shadow-sm transition-shadow duration-150"
    >
      <span className={cn("absolute inset-y-0 left-0 w-1.5", streifen)} aria-hidden />

      <div className="flex items-start gap-4 py-4 pl-6 pr-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-[17px] font-bold tabular-nums">{fall.aktenzeichen}</h2>
            <p className="text-[15px]">
              {fall.klaeger} ./. {fall.beklagte}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {sachgebietLabel[fall.sachgebiet]} · {euro(fall.streitwert)} ·{" "}
            {eingangLabel(fall.eingang)} · über {fall.uebermittlungsweg}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {bilanz.mangel > 0 ? (
              <StatusChip
                status="mangel"
                text={`${bilanz.mangel} ${bilanz.mangel === 1 ? "Mangel" : "Mängel"}`}
              />
            ) : null}
            {bilanz.pruefen > 0 ? (
              <StatusChip status="pruefen" text={`${bilanz.pruefen} bitte prüfen`} />
            ) : null}
            {bilanz.offen > 0 ? (
              <StatusChip status="offen" text={`${bilanz.offen} offen`} />
            ) : null}
            <StatusChip status="erfuellt" text={`${bilanz.erfuellt} erfüllt`} />

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[13px] text-muted-foreground hover:bg-muted"
                >
                  Zugewiesen: {sk?.bezeichnung} · {sk?.richter}
                  <Info className="size-3.5" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 text-sm">
                <p className="font-medium">Warum mir zugewiesen?</p>
                <p className="mt-2">{sk?.regel}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Automatische Anwendung des Geschäftsverteilungsplans. Keine
                  KI-Entscheidung.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!offen && bilanz.mangel === 0 && z.ablage === "eingang" ? (
            <Button onClick={() => setZustellungOffen(true)}>
              Zustellung verfügen
            </Button>
          ) : null}
          {z.ablage === "beanstandet" && z.beanstandung ? (
            <span className="text-sm text-muted-foreground">
              Frist läuft bis {z.beanstandung.fristBis}
            </span>
          ) : null}
          {z.ablage === "erledigt" ? (
            <span className="text-sm text-muted-foreground">
              An eAkte übergeben (simuliert)
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-expanded={offen}
            aria-label={offen ? "Fall zuklappen" : "Fall aufklappen"}
          >
            {offen ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {z.ablage === "beanstandet" && z.beanstandung && !offen ? (
        <div className="border-t border-border bg-muted px-6 py-3 text-sm">
          <p className="font-medium">{z.beanstandung.massnahme}</p>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">
            {z.beanstandung.text}
          </p>
        </div>
      ) : null}

      {offen ? (
        <div className="border-t border-border">
          <div className="grid h-[720px] grid-cols-1 lg:grid-cols-[2fr_3fr]">
            <PruefDashboard
              fall={fall}
              ergebnisse={ergebnisse}
              bilanz={bilanz}
              aktiverPunkt={aktiverPunkt}
              onImDokumentZeigen={imDokumentZeigen}
            />
            <DokumentAnsicht
              fall={fall}
              ergebnisse={ergebnisse}
              aktiverPunkt={aktiverPunkt}
              onMarkerKlick={(id) => {
                setAktiverPunkt(id);
                window.setTimeout(() => setAktiverPunkt(null), 1500);
              }}
              onPdf={() => exportiereMarkiertesPdf(fall, ergebnisse)}
            />
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-surface px-6 py-3">
            {z.ablage === "eingang" ? (
              <>
                <Button onClick={() => setZustellungOffen(true)}>
                  Zulässigkeit bestätigen · Zustellung verfügen
                </Button>
                <Button
                  variant="outline"
                  className="border-err text-err hover:bg-err-bg hover:text-err"
                  onClick={() => setBeanstandungOffen(true)}
                >
                  Beanstanden
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => rueckgaengig(fall.id)}>
                Zurück in den Posteingang
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => exportiereMarkiertesPdf(fall, ergebnisse)}
            >
              <Download className="size-4" />
              PDF mit Markierungen
            </Button>
          </div>
        </div>
      ) : null}

      <ZustellungDialog
        fall={fall}
        bilanz={bilanz}
        offen={zustellungOffen}
        onOpenChange={setZustellungOffen}
        onVerfuegen={(verfahrensart) => {
          setZustellungOffen(false);
          zustellungVerfuegen(fall.id, verfahrensart);
          toast.success(`Zustellung verfügt · ${fall.aktenzeichen}`, {
            duration: 8000,
            action: {
              label: "Rückgängig",
              onClick: () => rueckgaengig(fall.id),
            },
          });
        }}
      />

      <BeanstandungDialog
        fall={fall}
        ergebnisse={ergebnisse}
        offen={beanstandungOffen}
        onOpenChange={setBeanstandungOffen}
        onVerfuegen={(b) => {
          setBeanstandungOffen(false);
          beanstanden(fall.id, b);
          toast.success(`Beanstandung verfügt · ${fall.aktenzeichen}`, {
            duration: 8000,
            action: {
              label: "Rückgängig",
              onClick: () => rueckgaengig(fall.id),
            },
          });
        }}
      />
    </article>
  );
}
