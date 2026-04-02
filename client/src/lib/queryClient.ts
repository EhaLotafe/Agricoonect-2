// client/src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * 🌍 CONFIGURATION DE L'URL API (Production)
 * Récupère l'URL de Render depuis les variables d'environnement de Vercel.
 * Si on est en local, utilise une chaîne vide (le proxy Vite prend le relais).
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {}
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("agri_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * ✅ Mise à jour de apiRequest avec API_BASE_URL
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // On concatène l'URL du backend avec le chemin de l'API
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * ✅ Mise à jour de defaultQueryFn avec API_BASE_URL
 */
export const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const path = typeof queryKey[0] === "string" ? queryKey[0] : "/";

  // On concatène l'URL du backend avec le chemin de l'API
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (res.status === 401) {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_user");
  }

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 5 * 60 * 1000, 
      refetchOnWindowFocus: false, 
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});