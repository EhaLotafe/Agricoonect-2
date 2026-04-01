// server/db.ts
import { Pool, types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in your environment variables.");
}

types.setTypeParser(1700, (val) => parseFloat(val));

/**
 CONFIGURATION DE L'INFRASTRUCTURE (Axe Technique 2TUP)
 Justification TFC : Garantit la haute disponibilité et la sécurité des données recueillies via les sondages.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requis pour la connexion sécurisée à Supabase Cloud
  },
});

// Instance Drizzle ORM orchestrant le schéma relationnel
export const db = drizzle(pool, { schema });