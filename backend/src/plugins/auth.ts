import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";

import { env } from "../env.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, { secret: env.JWT_SECRET });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      await reply.code(401).send({ message: "Nicht angemeldet" });
    }
  });
}
