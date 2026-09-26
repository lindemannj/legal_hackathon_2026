import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import argon2 from "argon2";

import { env } from "../env.js";
import { prisma } from "../db.js";
import { seedSchema, type Seed } from "./schema.js";

function ladeSeed(): Seed {
  const pfad = resolve(process.cwd(), env.SEED_PATH);
  const roh = readFileSync(pfad, "utf-8");
  const json = JSON.parse(roh);
  return seedSchema.parse(json);
}

export async function seedDatenbank(): Promise<void> {
  const seed = ladeSeed();
  const passwortHash = await argon2.hash(env.DEMO_PASSWORT);

  for (const g of seed.gerichte) {
    await prisma.gericht.upsert({
      where: { id: g.id },
      create: g,
      update: { art: g.art, name: g.name, bezirk: g.bezirk },
    });
  }

  for (const e of seed.einheiten) {
    await prisma.einheit.upsert({
      where: { id: e.id },
      create: e,
      update: { gerichtId: e.gerichtId, bezeichnung: e.bezeichnung, zustaendigkeit: e.zustaendigkeit },
    });
  }

  for (const b of seed.benutzer) {
    await prisma.benutzer.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        kennung: b.kennung,
        name: b.name,
        amtsbezeichnung: b.amtsbezeichnung,
        rolle: b.rolle,
        demoKonto: b.demoKonto,
        passwortHash,
      },
      update: {
        kennung: b.kennung,
        name: b.name,
        amtsbezeichnung: b.amtsbezeichnung,
        rolle: b.rolle,
        demoKonto: b.demoKonto,
        passwortHash,
      },
    });
    await prisma.benutzerEinheit.deleteMany({ where: { benutzerId: b.id } });
    for (const einheitId of b.einheitIds) {
      await prisma.benutzerEinheit.create({ data: { benutzerId: b.id, einheitId } });
    }
  }

  for (const r of seed.gvpRegeln) {
    await prisma.gvpRegel.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        gerichtId: r.gerichtId,
        einheitId: r.einheitId,
        regelText: r.regelText,
        bedingung: JSON.stringify(r.bedingung),
      },
      update: {
        gerichtId: r.gerichtId,
        einheitId: r.einheitId,
        regelText: r.regelText,
        bedingung: JSON.stringify(r.bedingung),
      },
    });
  }

  for (const m of seed.merkmale) {
    await prisma.merkmal.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        nr: m.nr,
        kategorie: m.kategorie,
        titel: m.titel,
        norm: m.norm,
        quelle: m.quelle,
        beschreibung: m.beschreibung,
        gerichte: JSON.stringify(m.gerichte),
        platzhalter: m.platzhalter,
        aktiv: m.aktiv,
      },
      update: {
        nr: m.nr,
        kategorie: m.kategorie,
        titel: m.titel,
        norm: m.norm,
        quelle: m.quelle,
        beschreibung: m.beschreibung,
        gerichte: JSON.stringify(m.gerichte),
        platzhalter: m.platzhalter,
        aktiv: m.aktiv,
      },
    });
  }

  for (const v of seed.verfahrensregister) {
    await prisma.verfahrensregister.upsert({
      where: { az: v.az },
      create: v,
      update: {
        gerichtId: v.gerichtId,
        parteien: v.parteien,
        status: v.status,
        zugestelltAm: v.zugestelltAm,
      },
    });
  }

  // Fälle mit nurSimulation werden nicht als Eingang angelegt (siehe Pipeline-Spezifikation,
  // stehen erst über POST /demo/eingang bereit — folgt in Meilenstein 3).
  for (const f of seed.faelle.filter((x) => !x.nurSimulation)) {
    const extraktion = JSON.stringify({
      ...f.erwartet.extraktion,
      xjustizFelder: f.erwartet.xjustizFelder,
      xjustizAbweichungen: f.erwartet.xjustizAbweichungen,
    });

    await prisma.fall.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        gerichtId: f.gerichtId,
        einheitId: f.erwartet.zuweisung.einheitId,
        richterId: f.erwartet.zuweisung.richterId,
        regelId: f.erwartet.zuweisung.regelId,
        vorlaeufigesAz: f.vorlaeufigesAz,
        eingangAm: f.eingang.eingangAm,
        uebermittlungsweg: f.eingang.uebermittlungsweg,
        kostenvorschuss: f.eingang.kostenvorschuss,
        nurSimulation: false,
        xjustizXml: f.eingang.xjustizXml,
        extraktion,
        auswertungStatus: "abgeschlossen",
        ausgewertetAm: f.erwartet.auswertung.geprueftAm,
        regelwerkVersion: seed.meta.regelwerkVersion,
        modellVersion: seed.meta.modellVersion,
      },
      update: {
        einheitId: f.erwartet.zuweisung.einheitId,
        richterId: f.erwartet.zuweisung.richterId,
        regelId: f.erwartet.zuweisung.regelId,
        eingangAm: f.eingang.eingangAm,
        uebermittlungsweg: f.eingang.uebermittlungsweg,
        kostenvorschuss: f.eingang.kostenvorschuss,
        xjustizXml: f.eingang.xjustizXml,
        extraktion,
        auswertungStatus: "abgeschlossen",
        ausgewertetAm: f.erwartet.auswertung.geprueftAm,
        regelwerkVersion: seed.meta.regelwerkVersion,
        modellVersion: seed.meta.modellVersion,
      },
    });

    for (const d of f.eingang.dokumente) {
      await prisma.dokument.upsert({
        where: { id: d.id },
        create: { id: d.id, fallId: f.id, typ: d.typ, name: d.name, seiten: d.seiten, text: d.text },
        update: { typ: d.typ, name: d.name, seiten: d.seiten, text: d.text },
      });
    }

    for (const e of f.erwartet.auswertung.ergebnisse) {
      await prisma.ergebnis.upsert({
        where: { fallId_merkmalId: { fallId: f.id, merkmalId: e.merkmalId } },
        create: {
          fallId: f.id,
          merkmalId: e.merkmalId,
          status: e.status,
          relevanz: e.relevanz,
          text: e.text,
          grundlage: e.grundlage,
          fundstellen: JSON.stringify(e.fundstellen),
        },
        update: {
          status: e.status,
          relevanz: e.relevanz,
          text: e.text,
          grundlage: e.grundlage,
          fundstellen: JSON.stringify(e.fundstellen),
        },
      });
    }
  }

  console.log(
    `Seed abgeschlossen: ${seed.gerichte.length} Gerichte, ${seed.benutzer.length} Benutzer, ${seed.faelle.filter((f) => !f.nurSimulation).length} Fälle.`,
  );
}

const istDirektAufruf = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (istDirektAufruf) {
  seedDatenbank()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
