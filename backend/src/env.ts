import "dotenv/config";
import { z } from "zod";

const boolFromString = z
  .string()
  .default("false")
  .transform((v) => v === "true");

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.string().min(1).default("http://localhost:8080"),
  DATABASE_URL: z.string().min(1),
  SEED_PATH: z.string().min(1),
  SEED_ON_START: boolFromString,
  DEMO_MODE: boolFromString,
  DEMO_PASSWORT: z.string().min(1, "DEMO_PASSWORT ist erforderlich"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET ist erforderlich"),
  LLM_MODE: z.enum(["off", "live", "cache"]).default("off"),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  LLM_TOKEN_BUDGET: z.coerce.number().int().positive().default(200000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Ungültige Konfiguration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
