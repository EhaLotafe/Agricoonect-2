// client/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * 🎨 cn : Utilitaire de design atomique (Shadcn UI)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 💰 FORMATCURRENCY (Ancrage Économique Lubumbashi)
 * Formate les prix en Francs Congolais (FC) pour la transparence du marché.
 */
export function formatCurrency(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "0 FC";
  
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(value).replace("CDF", "FC"); // Plus naturel pour les Lubumbashiens
}

/**
 * 🌿 GETFRESHNESSSTATUS (Algorithme de Valorisation Temporelle)
 * Méthode Analytique : Calcule l'indice de fraîcheur pour réduire l'asymétrie d'information.
 */
export function getFreshnessStatus(harvestDate: string | Date | undefined) {
  if (!harvestDate) return { label: "Date non spécifiée", color: "text-slate-400", icon: "🗓️" };

  const date = new Date(harvestDate);
  const diff = differenceInDays(new Date(), date);

  // Indicateurs visuels basés sur la preuve temporelle
  if (diff <= 0) return { label: "Récolté aujourd'hui", color: "text-primary font-bold animate-pulse", icon: "✨" };
  if (diff <= 2) return { label: "Très frais", color: "text-primary", icon: "🌿" };
  if (diff <= 5) return { label: "Frais", color: "text-emerald-600", icon: "✅" };
  
  return { 
    label: `Récolté il y a ${formatDistanceToNow(date, { locale: fr, addSuffix: false })}`, 
    color: "text-muted-foreground",
    icon: "📦"
  };
}

/**
 * 📍 GETCOMMUNECOLOR (Cartographie des Bassins de Production)
 * Distinction visuelle des ceintures vertes de la ville.
 */
export function getCommuneColor(commune: string) {
  const mapping: Record<string, string> = {
    "Annexe": "bg-green-100 text-green-800 border-green-200",
    "Ruashi": "bg-orange-100 text-orange-800 border-orange-200",
    "Kipushi": "bg-blue-100 text-blue-800 border-blue-200",
    "Kenya": "bg-purple-100 text-purple-800 border-purple-200",
  };
  return mapping[commune] || "bg-slate-100 text-slate-800 border-slate-200";
}

/**
 * 📸 GETPRODUCTIMAGE (Traitement du SI Média)
 */
export function getProductImage(url: string | null) {
  if (!url) return "/no-image.png"; 
  return url; 
}