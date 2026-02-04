import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`,
  },
  engine: "classic",
  datasource: {
    url: process.env.DB_URL ?? env("POSTGRES_PRISMA_URL"),
  },
});
