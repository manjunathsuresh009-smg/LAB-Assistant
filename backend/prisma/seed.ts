import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/seedData";

const prisma = new PrismaClient();

seedDatabase(prisma, { force: true })
  .then((result) => {
    if (result.seeded) {
      console.log("[seed] demo data created:", result.counts);
    } else {
      console.log("[seed] skipped: database already contains data");
    }
  })
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
