import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUKTNAME, useDemo } from "@/context/DemoContext";
import { AuthService } from "@/services/mockBackend";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Klaris · Anmeldung zur Eingangsprüfung" },
      {
        name: "description",
        content:
          "Anmeldung zur Eingangsprüfung für Zivilgerichte: automatische Zuweisung nach Geschäftsverteilungsplan und Zulässigkeitsprüfung neuer Klagen.",
      },
      { property: "og:title", content: "Klaris · Anmeldung zur Eingangsprüfung" },
      {
        property: "og:description",
        content:
          "Prototyp für die Eingangsprüfung neuer Klagen an Amts- und Landgerichten.",
      },
    ],
  }),
  component: Anmeldung,
});

function Anmeldung() {
  const { anmelden, aktuellerNutzer } = useDemo();
  const navigate = useNavigate();
  const [kennung, setKennung] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const demoKonten = AuthService.demoKonten();

  useEffect(() => {
    if (aktuellerNutzer) navigate({ to: "/eingang" });
  }, [aktuellerNutzer, navigate]);

  function einloggen(k: string) {
    if (!anmelden(k)) {
      setFehler("Unbekannte Benutzerkennung.");
      return;
    }
    navigate({ to: "/eingang" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-primary">{PRODUKTNAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eingangsprüfung für Zivilgerichte
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              einloggen(kennung);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="kennung">Benutzerkennung</Label>
              <Input
                id="kennung"
                autoComplete="username"
                value={kennung}
                onChange={(e) => setKennung(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passwort">Passwort</Label>
              <Input id="passwort" type="password" autoComplete="current-password" />
            </div>
            {fehler ? (
              <p role="alert" className="text-sm text-destructive">
                {fehler}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Anmelden
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Demo-Modus · beliebiges Passwort
          </p>

          {demoKonten.length > 0 ? (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-sm font-semibold">Demo-Zugänge</h2>
            <div className="mt-3 space-y-2">
              {demoKonten.map((n) => (
                <Button
                  key={n.id}
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-0.5 py-3 text-left"
                  onClick={() => einloggen(n.kennung)}
                >
                  <span className="font-medium">{n.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {n.amtsbezeichnung} · {n.gericht} ·{" "}
                    {n.einheiten.map((e) => e.bezeichnung).join(", ")}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
