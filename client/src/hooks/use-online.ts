// client/src/hooks/use-online.ts
import { useState, useEffect } from "react";

/**
 * 📡 USEISONLINE (Résilience & Offline-First)
 * Justification TFC : Détecte l'état de la connectivité pour pallier l'instabilité 
 * des réseaux EDGE/3G dans les ceintures vertes (Annexe, Kipushi).
 * Base technique pour la synchronisation différée des données marketing.
 */
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Événements natifs du navigateur pour une détection temps réel
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}