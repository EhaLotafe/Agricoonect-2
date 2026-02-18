import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Correction compatibilité Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // ✅ AJOUT : Servir les images uploadées même en mode développement
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsPath));

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // On évite le process.exit ici pour laisser le développeur corriger sans relancer
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  let cachedTemplate: string | null = null;
  let lastModified = 0;

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    // On remonte d'un niveau pour trouver le client à la racine
    const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

    try {
      const stats = await fs.promises.stat(clientTemplate);
      if (!cachedTemplate || stats.mtimeMs > lastModified) {
        cachedTemplate = await fs.promises.readFile(clientTemplate, "utf-8");
        lastModified = stats.mtimeMs;
      }

      // Cache busting pour le rechargement forcé du script
      let template = cachedTemplate.replace(
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

export function serveStatic(app: Express) {
  // Chemin vers le build final
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const uploadsPath = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(distPath)) {
    throw new Error(`Répertoire de build introuvable : ${distPath}. Lancez 'npm run build' d'abord.`);
  }

  // ✅ AJOUT : Servir les uploads en mode production
  app.use("/uploads", express.static(uploadsPath));

  // Servir fichiers statiques (JS, CSS)
  app.use(express.static(distPath, { maxAge: "1d", etag: true }));

  // Fallback SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}