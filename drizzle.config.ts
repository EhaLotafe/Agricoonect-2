import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 💡 Indispensable pour que Drizzle puisse lire ton DATABASE_URL depuis le fichier .env
dotenv.config(); 

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquante. Vérifiez votre fichier .env");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});