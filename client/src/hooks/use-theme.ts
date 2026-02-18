// client/src/hooks/use-theme.ts
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

/**
 * Hook de gestion du thème Agri-Connect
 * Justification TFC : Optimisation de l'expérience utilisateur et 
 * économie d'énergie pour les terminaux mobiles en zone rurale.
 */
export function useTheme() {
  // Initialisation sécurisée avec localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("agri_theme") as Theme) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      // Détermination du thème à appliquer
      let effectiveTheme = theme;
      if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
          ? "dark" 
          : "light";
      }

      root.classList.remove("light", "dark");
      root.classList.add(effectiveTheme);
    };

    applyTheme();
    localStorage.setItem("agri_theme", theme);

    // Écouteur pour le changement dynamique du thème système
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme, setTheme };
}