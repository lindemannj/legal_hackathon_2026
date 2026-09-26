import { prisma } from "../db.js";
import { seedDatenbank } from "./seed.js";

async function reset(): Promise<void> {
  await prisma.verlaufEintrag.deleteMany();
  await prisma.entscheidung.deleteMany();
  await prisma.ergebnis.deleteMany();
  await prisma.dokument.deleteMany();
  await prisma.fall.deleteMany();
  await prisma.gvpRegel.deleteMany();
  await prisma.turnusZaehler.deleteMany();
  await prisma.verfahrensregister.deleteMany();
  await prisma.merkmal.deleteMany();
  await prisma.benutzerEinheit.deleteMany();
  await prisma.benutzer.deleteMany();
  await prisma.einheit.deleteMany();
  await prisma.gericht.deleteMany();
  await prisma.llmAufruf.deleteMany();
  await seedDatenbank();
}

reset()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
