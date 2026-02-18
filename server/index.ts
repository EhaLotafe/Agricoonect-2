// server/index.ts
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js"; 
import { setupVite, serveStatic, log } from "./vite.js";
import uploadsRouter from "./uploads.js";
import path from "path";
import fs from "fs";

const app = express();

// 1. Configuration des parsers (Toujours en premier)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * ⚡ GESTION DES FICHIERS (UPLOADS)
 * Argument TFC : Gestion de la persistance locale des médias
 */
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Servir les images pour le Frontend (URL : /uploads/nom-image.jpg)
app.use("/uploads", express.static(UPLOADS_DIR));

// 🚀 ROUTE API UPLOAD (URL : /api/uploads)
// On la place AVANT les logs et les routes générales pour éviter les interférences
app.use("/api/uploads", uploadsRouter);

/**
 * 📝 MIDDLEWARE DE LOGS (DEBUGGING)
 */
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && res.statusCode < 400) {
        const preview = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${preview.length > 50 ? preview.slice(0, 50) + "..." : preview}`;
      }
      log(logLine, "api");
    }
  });
  next();
});

(async () => {
  try {
    // 2. Enregistre les routes API métier (Products, Orders, etc.)
    const server = await registerRoutes(app);

    // 3. Gestion globale des erreurs
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
      console.error("❌ ERREUR SERVEUR:", err);
    });

    // 4. Configuration de l'environnement (Vite ou Statique)
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = process.env.PORT || 5000;
    server.listen(Number(PORT), "0.0.0.0", () => {
      log(`✅ Agri-Connect en ligne sur le port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Échec démarrage :", error);
    process.exit(1);
  }
})();