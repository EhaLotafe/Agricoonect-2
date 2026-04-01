// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * 🛠️ CONFIGURATION MODE DÉVELOPPEMENT
 * Justification TFC : Permet un cycle itératif rapide pour valider l'ergonomie 
 * du module de sondage auprès des utilisateurs tests.
 */
export async function setupVite(app: Express, server: Server) {
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  
  // Servir les photos de récoltes
  app.use("/uploads", express.static(uploadsPath));

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

    try {
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Injection d'un ID de version pour forcer la mise à jour des données marketing
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * 🚀 CONFIGURATION MODE PRODUCTION (PERFORMANCE)
 * Justification TFC : Optimisation de la bande passante pour garantir 
 * l'accessibilité du sondage marketing en zone à faible connectivité.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const uploadsPath = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(distPath)) {
    throw new Error(`Build introuvable. Lancez 'npm run build' d'abord.`);
  }

  app.use("/uploads", express.static(uploadsPath));

  // Mise en cache agressive (1 an) pour les assets statiques (logos, icônes du sondage)
  app.use(express.static(distPath, {
    maxAge: "31536000", 
    immutable: true,
    etag: true,
  }));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}