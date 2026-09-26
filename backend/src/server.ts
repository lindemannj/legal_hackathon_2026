import { buildApp } from "./app.js";
import { env } from "./env.js";
import { seedDatenbank } from "./seed/seed.js";

async function main(): Promise<void> {
  if (env.SEED_ON_START) {
    await seedDatenbank();
  }

  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
