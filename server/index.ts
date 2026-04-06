// server/index.ts
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js"; 
import { setupVite, serveStatic, log } from "./vite.js";
import uploadsRouter from "./uploads.js";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();

/**
 * 🛡️ SÉCURISATION DES ÉCHANGES (CORS)
 * Justification TFC : Autorise le Frontend (Vercel) à communiquer avec l'API 
 * de manière sécurisée, protégeant ainsi l'intégrité des sondages.
 */
app.use(cors({
  origin: ["https://agri-connect-rdc.vercel.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * ⚡ GESTION AUTOMATISÉE DU STOCKAGE MÉDIA
 * Le SI s'assure de l'existence des répertoires physiques au démarrage.
 */
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  log("Création du répertoire des médias agricole", "system");
}

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/api/uploads", uploadsRouter);

/**
 * 📝 MIDDLEWARE D'AUDIT DES REQUÊTES
 * Permet de monitorer le flux d'informations marketing en temps réel.
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
    /**
     * 🚀 INITIALISATION DU MOTEUR D'ANALYSE ET DES ROUTES
     * Convergeance des branches fonctionnelle et technique du cycle 2TUP.
     */
    const server = await registerRoutes(app);

    // Middleware global de capture d'exceptions (Sécurité du SI)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Erreur Interne du Système";
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
      console.error("❌ CRASH SERVEUR:", err);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = process.env.PORT || 5000;
    server.listen(Number(PORT), "0.0.0.0", () => {
      log(`✅ Moteur Agri-Connect opérationnel sur le port ${PORT}`);
      log(`📍 Environnement : ${app.get("env")}`);
    });

  } catch (error) {
    console.error("❌ ÉCHEC DU DÉMARRAGE DU SYSTÈME :", error);
    process.exit(1);
  }
})();