// client/src/lib/types.ts

/**
 * 👤 USERSTATE (Sécurité & RBAC)
 * Définit les privilèges d'accès selon les rôles identifiés dans le Scrum.
 */
export interface UserState {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'farmer' | 'buyer' | 'admin';
  location?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string; 
}

/**
 * 🌿 PRODUCTWITHFARMER (Valorisation par la donnée)
 * Interface centrale pour la méthode analytique : lie le produit à son origine rurale.
 */
export interface ProductWithFarmer {
  id: number;
  farmerId: number;
  name: string;
  description?: string;
  category: string;
  price: string; 
  unit: string; 
  quantity: number;
  availableQuantity: number;
  // --- Indicateurs de proximité (Axe Géographique du Mémoire) ---
  commune: string; // Annexe, Ruashi, etc.
  location: string; // Précision Village/Ferme
  harvestDate?: string; // Base de calcul de l'algorithme de fraîcheur
  province: string;
  
  images?: string[];
  isActive: boolean;
  isApproved: boolean; 
  createdAt: string;
  updatedAt: string;
  
  farmer: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  averageRating?: number;
  reviewCount?: number;
}

/**
 * 📊 MARKETTRENDS (Méthode Analytique & Quantitative)
 * Interface représentant les résultats du moteur de traitement des sondages.
 */
export interface MarketTrend {
  product: string;
  demandCount: number; // Fréquence de recherche
  totalQuantityRequested: number; // Volume total souhaité par le marché
  averageTargetPrice?: number; // "Juste prix" calculé par le système
}

/**
 * Interface Commande détaillée (OrderWithDetails)
 */
export interface OrderWithDetails {
  id: number;
  buyerId: number;
  productId: number;
  farmerId: number;
  quantity: number;
  totalPrice: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  
  product: {
    id: number;
    name: string;
    price: string;
    unit: string;
    images?: string[];
  };
  
  // Pour permettre à l'acheteur de contacter le vendeur
  farmer: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

/**
 * Interface Avis (ReviewWithUser)
 */
export interface ReviewWithUser {
  id: number;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  buyer: {
    firstName: string;
    lastName: string;
  };
}

/**
 * Interface Messagerie (ContactWithDetails)
 */
export interface ContactWithDetails {
  id: number;
  buyerId: number;
  productId: number;
  farmerId: number;
  message: string;
  buyerPhone?: string;
  status: 'pending' | 'contacted' | 'completed';
  createdAt: string;
  
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  
  product: {
    name: string;
  };
}