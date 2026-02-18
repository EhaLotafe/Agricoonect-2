// tailwind.config.ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"], // Pilotage par la classe .dark (mémoire : accessibilité/énergie)
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}" // Indispensable pour les types partagés
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // --- COULEURS IDENTITAIRES (Définitives) ---
        brand: {
          green: "#2D5A27",  // Vert Agri (Fertilité)
          orange: "#F97316", // Orange Marché (Dynamisme)
        },
        // --- MAPPAGE SHADCN/UI (HSL) ---
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Compatibilité avec tes anciens codes
        "agri-green": "hsl(var(--agri-green))",
        "agri-orange": "hsl(var(--agri-orange))",
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;