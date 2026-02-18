import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * ✅ Fonction de vérification des erreurs
 * Améliorée pour extraire le message JSON renvoyé par Express
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      // Si la réponse n'est pas du JSON
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

/**
 * ✅ Fonction d'injection du Token JWT
 * Indispensable pour que le Backend reconnaisse l'utilisateur
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
 * ✅ apiRequest : Pour les requêtes POST, PUT, PATCH, DELETE
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(), // Utilisation du JWT
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * ✅ defaultQueryFn : Pour les requêtes GET (React Query)
 */
export const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = typeof queryKey[0] === "string" ? queryKey[0] : "/";

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(), // On envoie le token si présent
  });

  // Si le token est expiré (401), on pourrait rediriger vers /login
  if (res.status === 401) {
    localStorage.removeItem("agri_token");
    // window.location.href = "/login"; // Optionnel : redirection forcée
  }

  await throwIfResNotOk(res);
  return await res.json();
};

/**
 * ✅ Initialisation du QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 5 * 60 * 1000, // Les données sont "fraîches" pendant 5 min
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});