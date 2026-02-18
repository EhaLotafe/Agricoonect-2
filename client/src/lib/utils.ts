// client/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * ✅ cn : Fusion des classes Tailwind (Évite les conflits de design)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 💰 formatCurrency : Localisation monétaire (Lubumbashi / RDC)
 */
export function formatCurrency(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "0 FC";
  
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 🌿 getFreshnessStatus : Algorithme de calcul de la fraîcheur
 * Justification TFC : Valorisation de la production locale par la preuve temporelle.
 */
export function getFreshnessStatus(harvestDate: string | Date | undefined) {
  if (!harvestDate) return { label: "Date non spécifiée", color: "text-slate-400" };

  const date = new Date(harvestDate);
  const diff = differenceInDays(new Date(), date);

  if (diff <= 0) return { label: "Récolté aujourd'hui", color: "text-primary font-bold animate-pulse" };
  if (diff <= 2) return { label: "Très frais", color: "text-primary" };
  if (diff <= 5) return { label: "Frais", color: "text-emerald-600" };
  
  return { 
    label: `Récolté il y a ${formatDistanceToNow(date, { locale: fr, addSuffix: false })}`, 
    color: "text-muted-foreground" 
  };
}

/**
 * 📍 getCommuneColor : Cartographie chromatique des zones ruraux de Lubumbashi
 */
export function getCommuneColor(commune: string) {
  const mapping: Record<string, string> = {
    "Annexe": "bg-green-100 text-green-800",
    "Ruashi": "bg-orange-100 text-orange-800",
    "Kipushi": "bg-blue-100 text-blue-800",
    "Kenya": "bg-purple-100 text-purple-800",
    "Katuba": "bg-red-100 text-red-800",
    "Kamalondo": "bg-teal-100 text-teal-800",
    "Kampemba": "bg-indigo-100 text-indigo-800",
  };
  return mapping[commune] || "bg-slate-100 text-slate-800";
}
// client/src/lib/utils.ts
export function getProductImage(url: string | null) {
  if (!url) return "/no-image.png"; // Une image par défaut
  if (url.startsWith('http')) return url; // Si c'est un lien externe
  return url; // Retourne /uploads/nom.jpg (le navigateur fera le lien avec le port 5000)
}