import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 1. Définition des Rôles (RBAC)
export const userTypeEnum = pgEnum("user_type", ["farmer", "buyer", "admin"]);

// ========== TABLES ==========

// shared/schema.ts (Partie Users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  userType: userTypeEnum("user_type").default("buyer").notNull(),
  location: varchar("location", { length: 255 }),
  profileImage: text("profile_image"), // ✅ RE-AJOUTE CETTE LIGNE
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  harvestDate: timestamp("harvest_date"), 
  commune: varchar("commune", { length: 100 }), 
  location: varchar("location", { length: 255 }).notNull(), 
  province: varchar("province", { length: 100 }).default("Haut-Katanga").notNull(),
  images: text("images").array(),
  isActive: boolean("is_active").default(true),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  farmerId: integer("farmer_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  farmerId: integer("farmer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), 
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  farmerId: integer("farmer_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  buyerPhone: varchar("buyer_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== INSERT SCHEMAS (Zod) ==========

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products, {
  // ✅ On force Zod à transformer le texte reçu en objet Date
  harvestDate: z.coerce.date(), 
  price: z.string(), // On accepte le prix en string pour la précision décimale
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true, 
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

// ========== UPDATE SCHEMAS (Zod) ==========
// Note : On ne ré-omet que les champs qui n'ont pas été déjà enlevés dans les insert schemas

export const updateProductSchema = insertProductSchema.partial().omit({
  farmerId: true,
});

export const updateOrderSchema = insertOrderSchema.partial().omit({
  buyerId: true,
  productId: true,
  farmerId: true,
  totalPrice: true,
});

export const updateContactSchema = insertContactSchema.partial().omit({
  buyerId: true,
  productId: true,
  farmerId: true,
});

// ========== TYPES EXPORTÉS ==========

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;