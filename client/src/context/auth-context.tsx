// client/src/context/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { UserState } from "@/lib/types";

interface AuthContextType {
  user: UserState | null;
  token: string | null;
  login: (user: UserState, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // 1. Initialisation : Récupération du Token et de l'User au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem("agri_user");
    const storedToken = localStorage.getItem("agri_token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Erreur de parsing session:", error);
        logout();
      }
    }
    setIsLoadingUser(false);
  }, []);

  // 2. Fonction de Connexion (Centralise le stockage)
  const login = (userData: UserState, authToken: string) => {
    localStorage.setItem("agri_user", JSON.stringify(userData));
    localStorage.setItem("agri_token", authToken);
    setUser(userData);
    setToken(authToken);
  };

  // 3. Fonction de Déconnexion (Nettoyage complet)
  const logout = () => {
    localStorage.removeItem("agri_user");
    localStorage.removeItem("agri_token");
    setUser(null);
    setToken(null);
    // Optionnel : rediriger vers l'accueil
    window.location.href = "/login";
  };

  // 4. Synchronisation entre les onglets
  useEffect(() => {
    const handleSync = (e: StorageEvent) => {
      if (e.key === "agri_token" && !e.newValue) logout();
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated: !!token, 
        isLoadingUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};