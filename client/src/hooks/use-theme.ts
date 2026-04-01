// client/src/hooks/use-theme.ts
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

/**
 * 🌓 USETHEME (Optimisation de l'Expérience Utilisateur)
 * Justification TFC : Adaptation de l'interface aux conditions de luminosité
 * extrêmes du Haut-Katanga (plein soleil vs zones à faible électrification).
 * Contribue à la réduction de la charge cognitive lors de la consultation des sondages.
 */
export function useTheme() {
  // Initialisation persistante (Méthode de développement contrôlé)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("agri_theme") as Theme) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      let effectiveTheme = theme;
      
      // Détection automatique des préférences du Système d'Exploitation
      if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
          ? "dark" 
          : "light";
      }

      // Manipulation directe du DOM pour une performance optimale (Shadcn/Tailwind)
      root.classList.remove("light", "dark");
      root.classList.add(effectiveTheme);
    };

    applyTheme();
    localStorage.setItem("agri_theme", theme);

    // Écouteur dynamique : Réactivité du SI aux changements de l'OS
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Fonction utilitaire pour le basculement rapide (Sprint UX)
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme, setTheme };
}