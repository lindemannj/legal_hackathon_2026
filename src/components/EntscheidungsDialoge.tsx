import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Beanstandung } from "@/context/DemoContext";
import type { Fall } from "@/types/domain";
import { FallService } from "@/services/mockBackend";
import { euro, fristDatum } from "@/lib/format";
import type { Bilanz, Pruefergebnis } from "@/lib/pruefung";

export const massnahmen = [
  { id: "hinweis", label: "Hinweis an die Klagepartei (§ 139 ZPO)" },
  {
    id: "verweisung",
    label: "Hinweis auf Unzuständigkeit, Verweisungsantrag anregen (§ 281 ZPO)",
  },
  { id: "abgabe", label: "Abgabe innerhalb des Gerichts nach Geschäftsverteilung" },
] as const;

export function ZustellungDialog({
  fall,
  bilanz,
  offen,
  onOpenChange,
  onVerfuegen,
}: {
  fall: Fall;
  bilanz: Bilanz;
  offen: boolean;
  onOpenChange: (o: boolean) => void;
  onVerfuegen: (verfahrensart: string) => void;
}) {
  const [verfahrensart, setVerfahrensart] = useState(
    "Schriftliches Vorverfahren (§ 276 ZPO)",
  );
  const [trotzdem, setTrotzdem] = useState(false);
  const blockiert = bilanz.mangel > 0 && !trotzdem;

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Zulässigkeit bestätigen · Zustellung verfügen</DialogTitle>
          <DialogDescription>
            {fall.aktenzeichen} · {fall.klaeger} ./. {fall.beklagte} ·{" "}
            {euro(fall.streitwert)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Weiteres Verfahren</p>
            <RadioGroup value={verfahrensart} onValueChange={setVerfahrensart}>
              {[
                "Schriftliches Vorverfahren (§ 276 ZPO)",
                "Früher erster Termin (§ 275 ZPO)",
              ].map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={v} />
                  <Label htmlFor={v} className="font-normal">
                    {v}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {fall.kostenvorschuss === "offen" ? (
            <p className="rounded border border-border bg-warn-bg p-3 text-sm text-warn">
              Zustellung erfolgt nach Eingang des Kostenvorschusses (§ 12 Abs. 1 GKG).
              Die Vorschussanforderung wird veranlasst.
            </p>
          ) : null}

          {bilanz.mangel > 0 ? (
            <label className="flex items-start gap-2 rounded border border-border p-3 text-sm">
              <Checkbox
                checked={trotzdem}
                onCheckedChange={(c) => setTrotzdem(c === true)}
              />
              <span>
                Trotz offener Punkte bestätigen ({bilanz.mangel}{" "}
                {bilanz.mangel === 1 ? "Auffälligkeit" : "Auffälligkeiten"})
              </span>
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button disabled={blockiert} onClick={() => onVerfuegen(verfahrensart)}>
            Verfügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BeanstandungDialog({
  fall,
  ergebnisse,
  offen,
  onOpenChange,
  onVerfuegen,
}: {
  fall: Fall;
  ergebnisse: Pruefergebnis[];
  offen: boolean;
  onOpenChange: (o: boolean) => void;
  onVerfuegen: (b: Beanstandung) => void;
}) {
  const auffaellige = useMemo(
    () =>
      ergebnisse.filter(
        (e) => e.status === "mangel" || e.status === "pruefen" || e.status === "offen",
      ),
    [ergebnisse],
  );
  const zustaendigkeitsmangel = auffaellige.some(
    (e) => (e.punkt.id === "L05" || e.punkt.id === "L06") && e.status === "mangel",
  );

  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [massnahme, setMassnahme] = useState<string>("");
  const [wochen, setWochen] = useState("2");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!offen) return;
    const vorauswahl = auffaellige
      .filter((e) => e.status === "mangel")
      .map((e) => e.punkt.id);
    setGewaehlt(vorauswahl);
    const m = zustaendigkeitsmangel ? massnahmen[1].label : massnahmen[0].label;
    setMassnahme(m);
    setWochen("2");
    setText("");
  }, [offen, fall, auffaellige, zustaendigkeitsmangel]);

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Klage beanstanden</DialogTitle>
          <DialogDescription>
            {fall.aktenzeichen} · {fall.klaeger} ./. {fall.beklagte}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Auffälligkeiten</legend>
            <ul className="space-y-2">
              {auffaellige.map((e) => (
                <li key={e.punkt.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    id={`m-${e.punkt.id}`}
                    checked={gewaehlt.includes(e.punkt.id)}
                    onCheckedChange={(c) =>
                      setGewaehlt((g) =>
                        c === true
                          ? [...g, e.punkt.id]
                          : g.filter((x) => x !== e.punkt.id),
                      )
                    }
                  />
                  <Label htmlFor={`m-${e.punkt.id}`} className="font-normal">
                    Nr. {e.punkt.nr} · {e.punkt.titel} ({e.punkt.norm})
                  </Label>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Maßnahme</legend>
            <RadioGroup value={massnahme} onValueChange={setMassnahme}>
              {massnahmen.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  <RadioGroupItem value={m.label} id={m.id} />
                  <Label htmlFor={m.id} className="font-normal">
                    {m.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>

          <div>
            <p className="mb-2 text-sm font-medium">Frist zur Stellungnahme</p>
            <ToggleGroup
              type="single"
              variant="outline"
              value={wochen}
              onValueChange={(v) => v && setWochen(v)}
            >
              {["1", "2", "3", "4"].map((w) => (
                <ToggleGroupItem key={w} value={w}>
                  {w} {w === "1" ? "Woche" : "Wochen"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div>
            <Label htmlFor="hinweistext" className="text-sm font-medium">
              Begründung / Hinweistext
            </Label>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Entwurf, bitte prüfen</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setText(FallService.formulierungsvorschlag(fall.id, gewaehlt).text)
                }
              >
                Formulierungsvorschlag einfügen
              </Button>
            </div>
            <Textarea
              id="hinweistext"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={text.trim().length === 0}
            onClick={() =>
              onVerfuegen({
                maengel: gewaehlt,
                massnahme,
                fristWochen: Number(wochen),
                fristBis: fristDatum(new Date().toISOString(), Number(wochen)),
                text,
              })
            }
          >
            Beanstandung verfügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
