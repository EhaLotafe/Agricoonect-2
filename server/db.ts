import { Pool, types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in your environment variables.");
}

/**
 * Configuration du Pool PostgreSQL
 * Ajout de la configuration SSL indispensable pour Supabase
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Nécessaire pour les certificats auto-signés de Supabase/Heroku
  },
});

// Instance Drizzle ORM avec le pool et le schéma global
export const db = drizzle(pool, { schema });