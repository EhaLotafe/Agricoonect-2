// client/src/lib/types.ts

/**
 * Interface de l'utilisateur connecté (UserState)
 * Reflète les informations stockées dans le Token JWT
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
 * Interface Produit étendue (ProductWithFarmer)
 * Inclut les badges spécifiques à Lubumbashi et la fraîcheur
 */
export interface ProductWithFarmer {
  id: number;
  farmerId: number;
  name: string;
  description?: string;
  category: string;
  price: string; // Décimal converti en string par le driver PG
  unit: string; // kg, sac, seau
  quantity: number;
  availableQuantity: number;
  
  // --- Spécificités Lubumbashi / Mémoire ---
  commune: string; // Annexe, Ruashi, etc.
  location: string; // Précision (Village/Ferme)
  harvestDate?: string; // ISO date pour l'indicateur de fraîcheur
  province: string;
  
  images?: string[];
  isActive: boolean;
  isApproved: boolean; // Statut de modération admin
  createdAt: string;
  updatedAt: string;
  
  // Données de l'agriculteur jointes
  farmer: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  
  // Métadonnées d'évaluation
  averageRating?: number;
  reviewCount?: number;
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