import type { FastifyInstance } from "fastify";

import { prisma } from "../db.js";
import { alsFall, fallInclude } from "../mappers/fall.js";

export async function faelleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/faelle", { preHandler: app.authenticate }, async (request) => {
    const einheiten = await prisma.benutzerEinheit.findMany({
      where: { benutzerId: request.user.sub },
      select: { einheitId: true },
    });
    const einheitIds = einheiten.map((e) => e.einheitId);

    const faelle = await prisma.fall.findMany({
      where: { einheitId: { in: einheitIds } },
      include: fallInclude,
    });
    return faelle.map(alsFall);
  });

  app.get("/faelle/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const fall = await prisma.fall.findUnique({ where: { id }, include: fallInclude });
    if (!fall) {
      return reply.code(404).send({ message: "Fall nicht gefunden" });
    }

    const zugriff = await prisma.benutzerEinheit.findUnique({
      where: { benutzerId_einheitId: { benutzerId: request.user.sub, einheitId: fall.einheitId } },
    });
    if (!zugriff) {
      return reply.code(403).send({ message: "Kein Zugriff auf diesen Fall" });
    }

    return alsFall(fall);
  });
}
