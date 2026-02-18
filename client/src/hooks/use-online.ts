// client/src/hooks/use-online.ts
import { useState, useEffect } from "react";

/**
 * 📡 useIsOnline : Détecte l'état de la connexion internet
 * Essentiel pour ton argumentaire "Offline-First" à Lubumbashi
 */
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
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