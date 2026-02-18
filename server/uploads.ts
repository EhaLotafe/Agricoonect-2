import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "lubum_agri_2025_secret";
const router = express.Router();

/**
 * 📂 INITIALISATION DU RÉPERTOIRE
 * On s'assure que le dossier public/uploads existe à la racine du projet.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 🛡️ MIDDLEWARE DE SÉCURITÉ
 * Vérification du Token JWT pour l'accès aux ressources médias.
 */
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentification requise pour l'upload." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Session expirée ou Token média invalide." });
  }
};

/**
 * ⚙️ CONFIGURATION MULTER (INGÉNIERIE MÉDIA)
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Nettoyage du nom pour éviter les problèmes de caractères spéciaux en RDC
    const cleanName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `agri-${uniqueSuffix}-${cleanName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite 2 MB (Optimisation bande passante rurale)
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format non autorisé. Utilisez PNG, JPG ou WebP."));
    }
  },
});

/**
 * 🚀 ROUTE POST /api/uploads
 * Traite jusqu'à 5 images simultanément.
 */
router.post("/", verifyToken, (req: Request, res: Response) => {
  // Cast en 'any' pour éviter les conflits de types entre bibliothèques
  (upload.array("images", 5) as any)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Limite atteinte: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Aucune image détectée dans la requête." });
    }

    // On retourne les URLs relatives pour stockage propre en base de données
    const urls = files.map((file) => `/uploads/${file.filename}`);
    
    console.log(`📸 Images traitées avec succès : ${urls.length} fichiers.`);
    res.json({ success: true, urls });
  });
});

export default router;