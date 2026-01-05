import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct URL for migrations (bypasses Accelerate)
    url: process.env["DIRECT_DATABASE_URL"] || process.env["POSTGRES_URL"],
  },
});
