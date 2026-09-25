import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRODUKTNAME, useDemo } from "@/context/DemoContext";

export function Kopfzeile({ onSimulieren }: { onSimulieren?: () => void }) {
  const { aktuellerNutzer, abmelden, zuruecksetzen } = useDemo();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-baseline gap-3">
        <Link to="/eingang" className="text-[17px] font-bold text-primary">
          {PRODUKTNAME}
        </Link>
        <span className="text-sm text-muted-foreground">
          {aktuellerNutzer
            ? `${aktuellerNutzer.gericht} · ${aktuellerNutzer.spruchkoerperKurz}`
            : "Eingangsprüfung für Zivilgerichte"}
        </span>
      </div>

      {aktuellerNutzer ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <span className="text-right">
                <span className="block text-sm font-medium">
                  {aktuellerNutzer.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {aktuellerNutzer.amtsbezeichnung}
                </span>
              </span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem onSelect={() => navigate({ to: "/einstellungen" })}>
              Meine Prüfliste
            </DropdownMenuItem>
            {onSimulieren ? (
              <DropdownMenuItem onSelect={onSimulieren}>
                Demo: neuen EGVP-Eingang simulieren
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onSelect={() => {
                zuruecksetzen();
                toast.success("Demo zurückgesetzt");
              }}
            >
              Demo zurücksetzen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                abmelden();
                navigate({ to: "/" });
              }}
            >
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  );
}

export function Fusszeile() {
  return (
    <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
      Prototyp · fiktive Demo-Daten
    </footer>
  );
}
