import {
  users, products, orders, reviews, contacts,
  type User, type InsertUser, type Product, type InsertProduct,
  type Order, type InsertOrder, type Review, type InsertReview,
  type Contact, type InsertContact,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";

// Alias pour les jointures complexes (Acheteur / Vendeur)
const farmers = aliasedTable(users, "farmers");
const buyers = aliasedTable(users, "buyers");

export interface IStorage {
  // Utilisateurs
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Produits
  getProduct(id: number): Promise<Product | undefined>;
  getProductWithFarmer(id: number): Promise<any>;
  getProductsByFarmer(farmerId: number): Promise<Product[]>;
  getAllProducts(filters?: any): Promise<any[]>; // Signature propre
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  approveProduct(id: number): Promise<Product>;

  // Commandes
  getOrderWithDetails(id: number): Promise<any>;
  getOrdersByBuyer(buyerId: number): Promise<any[]>;
  getOrdersByFarmer(farmerId: number): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;

  // Avis / Contacts / Stats
  getReviewsByProduct(productId: number): Promise<any[]>;
  createReview(review: InsertReview): Promise<Review>;
  getContactsByFarmer(farmerId: number): Promise<any[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  getStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // --- UTILISATEURS ---
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(userData: InsertUser) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async updateUser(id: number, userData: Partial<InsertUser>) {
    const [user] = await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // --- PRODUITS ---
  async getProduct(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  // server/storage.ts

  async getProductWithFarmer(id: number) {
    const result = await db
      .select({ product: products, farmer: users })
      .from(products)
      .leftJoin(users, eq(products.farmerId, users.id))
      .where(eq(products.id, id));

    if (result.length === 0) return undefined;
    // On retourne le produit en y injectant les infos du farmer
    return { 
      ...result[0].product, 
      farmer: result[0].farmer 
    };
  }

  async getAllProducts(filters: any) {
    const conditions = [];
    
    // Logique de filtrage intelligente (Admin vs Public)
    if (filters?.isApproved === true) conditions.push(eq(products.isApproved, true));
    if (filters?.isApproved === false) conditions.push(eq(products.isApproved, false));
    // Si filters.isApproved est undefined, on ne filtre pas (comportement Admin)

    if (filters?.category) conditions.push(eq(products.category, filters.category));
    if (filters?.commune) conditions.push(eq(products.commune, filters.commune));
    if (filters?.search) conditions.push(like(products.name, `%${filters.search}%`));

    const query = db
      .select({
        product: products,
        farmer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
        }
      })
      .from(products)
      .leftJoin(users, eq(products.farmerId, users.id));

    const result = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(products.createdAt))
      : await query.orderBy(desc(products.createdAt));

    return result.map(row => ({
      ...row.product,
      farmer: row.farmer
    }));
  }

  async createProduct(productData: InsertProduct) {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>) {
    const [product] = await db.update(products).set({ ...productData, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  }

  async approveProduct(id: number) {
    const [product] = await db.update(products).set({ isApproved: true, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductsByFarmer(farmerId: number) {
    return await db.select().from(products).where(eq(products.farmerId, farmerId)).orderBy(desc(products.createdAt));
  }

  // --- COMMANDES ---
  async getOrderWithDetails(id: number) {
    const result = await db
      .select({ order: orders, product: products, buyer: buyers, farmer: farmers })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .leftJoin(farmers, eq(orders.farmerId, farmers.id))
      .where(eq(orders.id, id));
    if (result.length === 0) return undefined;
    return { ...result[0].order, product: result[0].product, buyer: result[0].buyer, farmer: result[0].farmer };
  }

  async getOrdersByBuyer(buyerId: number) {
    const result = await db
      .select({ order: orders, product: products, farmer: farmers })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(farmers, eq(orders.farmerId, farmers.id))
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));
    return result.map(r => ({ ...r.order, product: r.product, farmer: r.farmer }));
  }

  async getOrdersByFarmer(farmerId: number) {
    const result = await db
      .select({ order: orders, product: products, buyer: buyers })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .where(eq(orders.farmerId, farmerId))
      .orderBy(desc(orders.createdAt));
    return result.map(r => ({ ...r.order, product: r.product, buyer: r.buyer }));
  }

  async createOrder(orderData: InsertOrder) {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>) {
    const [order] = await db.update(orders).set({ ...orderData, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  }

  // --- AVIS & CONTACTS ---
  async getReviewsByProduct(productId: number) {
    const result = await db
      .select({ review: reviews, buyer: users })
      .from(reviews)
      .leftJoin(users, eq(reviews.buyerId, users.id))
      .where(eq(reviews.productId, productId));
    return result.map(r => ({ ...r.review, buyer: r.buyer }));
  }

  async createReview(reviewData: InsertReview) {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async getContactsByFarmer(farmerId: number) {
    const result = await db
      .select({ contact: contacts, buyer: buyers, product: products })
      .from(contacts)
      .leftJoin(buyers, eq(contacts.buyerId, buyers.id))
      .leftJoin(products, eq(contacts.productId, products.id))
      .where(eq(contacts.farmerId, farmerId));
    return result.map(r => ({ ...r.contact, buyer: r.buyer, product: r.product }));
  }

  async createContact(contactData: InsertContact) {
    const [contact] = await db.insert(contacts).values(contactData).returning();
    return contact;
  }

  // --- STATISTIQUES ---
  async getStats() {
    try {
      const [farmerCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.userType, "farmer"));
      const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isApproved, true));
      const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
      const communesResult = await db.select({ name: products.commune }).from(products).groupBy(products.commune);

      return {
        totalFarmers: Number(farmerCount?.count || 0),
        totalProducts: Number(productCount?.count || 0),
        totalOrders: Number(orderCount?.count || 0),
        totalCommunes: communesResult.length || 0,
      };
    } catch (error) {
      return { totalFarmers: 0, totalProducts: 0, totalOrders: 0, totalCommunes: 0 };
    }
  }
}

export const storage = new DatabaseStorage();