import app from "./app";
import { config } from "./config";
import { prisma } from "./prisma";
import { seedDatabase } from "./seedData";

async function bootstrap(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error(
      "[campuslab] Database is not reachable. Run `npm run db:push` (and `npm run seed`) before starting."
    );
    throw error;
  }

  if (process.env.AUTO_SEED !== "false") {
    try {
      const result = await seedDatabase(prisma);
      if (result.seeded) console.log("[campuslab] empty database seeded with demo data", result.counts);
    } catch (error) {
      console.error("[campuslab] automatic seeding skipped:", error);
    }
  }

  const server = app.listen(config.port, () => {
    console.log(
      `[campuslab] API listening on http://localhost:${config.port} (${config.nodeEnv})`
    );
    console.log(`[campuslab] Health check: http://localhost:${config.port}/api/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[campuslab] ${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch(async (error) => {
  console.error("[campuslab] failed to start:", error);
  await prisma.$disconnect();
  process.exit(1);
});
