// server/db.ts
import { Pool, types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in your environment variables.");
}

/**
 * 📊 PARSING QUANTITATIF
 * Force le moteur à transformer les chaînes de caractères Decimal de PostgreSQL 
 * en nombres flottants JavaScript pour les calculs du moteur d'analyse.
 */
types.setTypeParser(1700, (val) => parseFloat(val));

/**
 * 🛠️ CONFIGURATION DE L'INFRASTRUCTURE (Rigueur du SI)
 * Justification TFC : Garantit la haute disponibilité et la résilience des 
 * données recueillies via les sondages obligatoires.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requis pour la connexion sécurisée (SSL) à Supabase Cloud
  },
  // Optimisation pour les environnements Cloud (Render Free)
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Instance Drizzle ORM orchestrant le schéma relationnel de la plateforme
export const db = drizzle(pool, { schema });