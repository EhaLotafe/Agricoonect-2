// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * 🛠️ GESTIONNAIRE D'EXCEPTIONS (Méthode Analytique)
 * Garantit l'intégrité des données en interceptant les erreurs de l'API.
 * Crucial pour ne pas fausser les calculs statistiques du marketing.
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      // Échec du parsing JSON : Erreur serveur brute
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

/**
 * 🛡️ INJECTEUR DE SÉCURITÉ (RBAC)
 * Automatise l'envoi du Token JWT pour identifier le rôle (Agriculteur/Acheteur).
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("agri_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * ⚡ GESTIONNAIRE DE MUTATIONS (POST/PUT/PATCH/DELETE)
 * Utilisé pour soumettre les sondages obligatoires.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * 📊 RÉCUPÉRATEUR DE DONNÉES (GET)
 * Point d'entrée pour collecter les statistiques de marché en temps réel.
 */
export const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = typeof queryKey[0] === "string" ? queryKey[0] : "/";

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  // Gestion de l'expiration de session pour la sécurité du SI
  if (res.status === 401) {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_user");
    // Optionnel: window.location.href = "/login";
  }

  await throwIfResNotOk(res);
  return await res.json();
};

/**
 * 🚀 CONFIGURATION DU QUERYCLIENT (Optimisation Rurale)
 * Paramétrage adapté aux contraintes de connectivité de Lubumbashi.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      // Les données sont gardées 5 min en cache pour limiter les requêtes réseaux inutiles
      staleTime: 5 * 60 * 1000, 
      // On désactive le rechargement auto pour économiser la bande passante (Edge/3G)
      refetchOnWindowFocus: false, 
      retry: false, // Évite les boucles de requêtes en cas de coupure réseau
    },
    mutations: {
      retry: false,
    },
  },
});