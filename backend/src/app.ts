import cors from "@fastify/cors";
import Fastify from "fastify";

import { env } from "./env.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { faelleRoutes } from "./routes/faelle.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.FRONTEND_ORIGIN });
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(faelleRoutes);

  return app;
}
