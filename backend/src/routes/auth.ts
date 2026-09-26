import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";

import { prisma } from "../db.js";
import { env } from "../env.js";
import { alsNutzer } from "../mappers/nutzer.js";

const benutzerInclude = { einheiten: { include: { einheit: { include: { gericht: true } } } } } as const;

const loginBody = z.object({
  kennung: z.string().min(1),
  passwort: z.string(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", async (request, reply) => {
    const body = loginBody.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ message: "Ungültige Anfrage" });
    }

    // SQLite kennt in Prisma kein `mode: "insensitive"`, daher Vergleich in JS.
    const kennung = body.data.kennung.trim().toLowerCase();
    const alle = await prisma.benutzer.findMany({ include: benutzerInclude });
    const benutzer = alle.find((b) => b.kennung.toLowerCase() === kennung || b.id === kennung);
    if (!benutzer) {
      return reply.code(401).send({ message: "Unbekannte Kennung" });
    }

    if (!env.DEMO_MODE) {
      const gueltig = await argon2.verify(benutzer.passwortHash, body.data.passwort);
      if (!gueltig) {
        return reply.code(401).send({ message: "Falsches Passwort" });
      }
    }

    const token = app.jwt.sign({ sub: benutzer.id });
    return { ...alsNutzer(benutzer), token };
  });

  app.get("/auth/demo-konten", async () => {
    const benutzer = await prisma.benutzer.findMany({
      where: { demoKonto: true },
      include: benutzerInclude,
    });
    return benutzer.map(alsNutzer);
  });

  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const benutzer = await prisma.benutzer.findUnique({
      where: { id: request.user.sub },
      include: benutzerInclude,
    });
    if (!benutzer) {
      return reply.code(401).send({ message: "Nicht angemeldet" });
    }
    return alsNutzer(benutzer);
  });
}
