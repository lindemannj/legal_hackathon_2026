import { z } from "zod";

const gerichtstyp = z.enum(["AG", "LG"]);
const status = z.enum([
  "erfuellt",
  "mangel",
  "pruefen",
  "offen",
  "keine_anhaltspunkte",
  "nicht_anwendbar",
]);
const sachgebiet = z.enum([
  "allgemein",
  "wohnraummiete",
  "nachbarrecht",
  "heilbehandlung",
  "veroeffentlichung",
  "vergabe",
]);

const partei = z.object({
  name: z.string().min(1),
  art: z.enum(["natuerlich", "juristisch"]),
  anschrift: z.string().optional(),
  vertretenDurch: z.string().optional(),
});

export const seedSchema = z.object({
  schemaVersion: z.literal(1),
  meta: z.object({
    regelwerkVersion: z.string().min(1),
    modellVersion: z.string().min(1),
  }),
  gerichte: z.array(
    z.object({
      id: z.string().min(1),
      art: gerichtstyp,
      name: z.string().min(1),
      bezirk: z.string().min(1),
    }),
  ),
  einheiten: z.array(
    z.object({
      id: z.string().min(1),
      gerichtId: z.string().min(1),
      bezeichnung: z.string().min(1),
      zustaendigkeit: z.string().default(""),
    }),
  ),
  benutzer: z.array(
    z.object({
      id: z.string().min(1),
      kennung: z.string().min(1),
      name: z.string().min(1),
      amtsbezeichnung: z.string().min(1),
      rolle: z.enum(["richter", "geschaeftsstelle", "admin"]),
      einheitIds: z.array(z.string()).min(1),
      demoKonto: z.boolean().default(false),
    }),
  ),
  gvpRegeln: z.array(
    z.object({
      id: z.string().min(1),
      gerichtId: z.string().min(1),
      einheitId: z.string().min(1),
      regelText: z.string().min(1),
      kurzText: z.string().optional(),
      /** kleinere Zahl = höherer Vorrang; ohne Angabe nachrangig */
      vorrang: z.number().int().optional(),
      bedingung: z.object({
        sachgebiet: sachgebiet,
        sachgebieteZusaetzlich: z.array(sachgebiet).optional(),
        eingangsnummerEndziffer: z.string().regex(/^\d$/).optional(),
        beklagteAnfangsbuchstaben: z
          .string()
          .regex(/^[A-Z]-[A-Z]$/)
          .optional(),
      }),
    }),
  ),
  merkmale: z.array(
    z.object({
      id: z.string().regex(/^L\d{2}$/),
      nr: z.number().int().positive(),
      kategorie: z.enum(["allgemein", "hindernis"]),
      titel: z.string().min(1),
      norm: z.string(),
      quelle: z.enum(["regel", "ki", "manuell"]),
      beschreibung: z.string().default(""),
      gerichte: z.array(gerichtstyp).min(1),
      nurAufRuege: z.boolean().default(false),
      aktiv: z.boolean(),
    }),
  ),
  verfahrensregister: z.array(
    z.object({
      az: z.string().min(1),
      gerichtId: z.string().min(1),
      parteien: z.string().min(1),
      status: z.string().min(1),
      zugestelltAm: z.string().optional(),
    }),
  ),
  faelle: z.array(
    z.object({
      id: z.string().min(1),
      gerichtId: z.string().min(1),
      vorlaeufigesAz: z.string().min(1),
      nurSimulation: z.boolean().default(false),
      eingang: z.object({
        eingangAm: z.string().min(1),
        uebermittlungsweg: z.string().min(1),
        kostenvorschuss: z.enum(["bezahlt", "offen"]),
        xjustizXml: z.string(),
        dokumente: z
          .array(
            z.object({
              id: z.string().min(1),
              typ: z.enum(["klageschrift", "anlage"]),
              name: z.string().min(1),
              seiten: z.number().int().nonnegative(),
              text: z.string().optional(),
            }),
          )
          .refine((d) => d.some((x) => x.typ === "klageschrift" && x.text), {
            message: "Klageschrift mit text fehlt",
          }),
      }),
      erwartet: z.object({
        extraktion: z.object({
          klaeger: z.array(partei).min(1),
          beklagte: z.array(partei).min(1),
          sachgebiet: sachgebiet,
          streitwertCent: z.number().int().nonnegative(),
          streitwertXJustizCent: z.number().int().nonnegative().optional(),
          gegenstand: z.string().optional(),
          prozessbevollmaechtigter: z.string().nullable().optional(),
        }),
        xjustizFelder: z.record(z.string()),
        xjustizAbweichungen: z.array(z.string()).default([]),
        zuweisung: z.object({
          einheitId: z.string().min(1),
          richterId: z.string().min(1),
          regelId: z.string().min(1),
        }),
        auswertung: z.object({
          geprueftAm: z.string().min(1),
          ergebnisse: z.array(
            z.object({
              merkmalId: z.string().min(1),
              status,
              relevanz: z.enum(["hoch", "mittel", "niedrig"]).optional(),
              text: z.string(),
              grundlage: z.string().optional(),
              fundstellen: z
                .array(z.object({ dokumentId: z.string().min(1), zitat: z.string() }))
                .default([]),
              verweisAz: z.string().optional(),
            }),
          ),
        }),
        formulierungsvorschlag: z.string(),
      }),
    }),
  ),
});

export type Seed = z.infer<typeof seedSchema>;
