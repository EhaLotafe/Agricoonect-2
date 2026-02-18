// scan-invalid-routes.ts
import * as fs from "fs";
import * as path from "path";

// ✅ Correction du chemin pour pointer vers le dossier client/src
const ROOT_DIR = path.resolve(process.cwd(), "client", "src");
const DISALLOWED_PATH = "/admin";
const ALLOWED_API_PREFIX = "/api/admin";

const scanFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return []; // Sécurité si le dossier n'existe pas
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

const validateFile = (filePath: string): string[] => {
  const content = fs.readFileSync(filePath, "utf-8");
  const invalidUsages: string[] = [];

  // Regex pour détecter les chaînes de caractères contenant '/admin'
  const matches = content.match(/(["'`])\/[^"'`]*admin[^"'`]*\1/g);
  if (matches) {
    for (const match of matches) {
      const cleaned = match.slice(1, -1); // suppression des guillemets

      // ✅ Autorise les appels API vers /api/admin
      if (cleaned.startsWith(ALLOWED_API_PREFIX)) {
        continue;
      }

      // 🚫 Interdit les accès directs ou mal formés contenant '/admin'
      if (cleaned.includes(DISALLOWED_PATH)) {
        invalidUsages.push(cleaned);
      }
    }
  }

  return invalidUsages;
};

console.log(`🔍 Scan de sécurité des routes dans : ${ROOT_DIR}...`);

const files = scanFiles(ROOT_DIR);
let hasInvalidRoutes = false;

for (const file of files) {
  const invalidRoutes = validateFile(file);
  if (invalidRoutes.length > 0) {
    hasInvalidRoutes = true;
    const relativePath = path.relative(process.cwd(), file);
    console.error(`\n🚫 Erreur de sécurité dans le fichier: ${relativePath}`);
    invalidRoutes.forEach((route) => console.error(`  -> Route non autorisée détectée : "${route}"`));
  }
}

if (hasInvalidRoutes) {
  console.error("\n❌ ÉCHEC : Des routes '/admin' non sécurisées ont été trouvées dans le Frontend.");
  console.error("Veuillez utiliser exclusivement le préfixe '/api/admin' pour vos appels API.");
  process.exit(1);
} else {
  console.log("\n✅ VÉRIFICATION TERMINÉE : Aucune vulnérabilité de route détectée.");
}