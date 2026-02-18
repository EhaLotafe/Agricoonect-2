import express, { Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertProductSchema,
  insertOrderSchema,
  insertReviewSchema,
  insertContactSchema,
  updateProductSchema,
  updateOrderSchema,
  updateContactSchema,
} from "@shared/schema";
import jwt from "jsonwebtoken";
import uploadsRouter from "./uploads";
import z from "zod";

const SECRET_KEY = process.env.JWT_SECRET || "lubum_agri_2025_secret";

// --- MIDDLEWARES ---

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Session expirée ou invalide" });
  }
};

const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.userType)) {
      return res.status(403).json({ message: "Accès interdit : privilèges insuffisants" });
    }
    next();
  };
};

function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err?.name === "ZodError") {
    return res.status(400).json({ message: "Erreur de validation", issues: err.issues });
  }
  res.status(err.status || 500).json({ message: err.message || "Erreur interne" });
}

export async function registerRoutes(app: express.Express): Promise<Server> {
  
  // --- AUTHENTIFICATION ---
  // server/routes.ts

app.post("/api/register", async (req, res, next) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await storage.createUser({ ...userData, password: hashedPassword });
    
    // ✅ GÉNÉRATION DU TOKEN DÈS L'INSCRIPTION
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    // On renvoie le pack complet : user + token
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) { next(error); }
});

  app.post("/api/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }
      const token = jwt.sign({ id: user.id, email: user.email, userType: user.userType }, SECRET_KEY, { expiresIn: "30d" });
      const { password: _, ...userData } = user;
      res.json({ token, user: userData });
    } catch (error) { next(error); }
  });

  // --- PRODUITS ---
  // server/routes.ts

  // --- PRODUITS ---
  app.get("/api/products", async (req, res, next) => {
    try {
      const { category, commune, province, search, approved } = req.query;
      const filters: any = { isApproved: approved !== "false" };
      if (category) filters.category = category;
      if (commune) filters.commune = commune;
      if (province) filters.province = province;
      if (search) filters.search = search;
      const products = await storage.getAllProducts(filters);
      res.json(products);
    } catch (error) { next(error); }
  });

  // server/routes.ts

app.post("/api/products", verifyToken, checkRole(['farmer', 'admin']), async (req, res, next) => {
    try {
      // 1. On valide les données (Zod va maintenant convertir la date tout seul)
      const data = insertProductSchema.parse(req.body);
      
      // 2. On crée le produit avec l'ID de l'utilisateur connecté
      const product = await storage.createProduct({ 
        ...data, 
        farmerId: (req as any).user.id,
        availableQuantity: Number(data.quantity) // Sécurité conversion nombre
      });
      
      res.status(201).json(product);
    } catch (error) { 
      console.error("❌ Erreur de publication:", error);
      next(error); 
    }
});

  // 🔄 Route de Synchronisation (Argument Mémoire)
  app.post("/api/products/sync", verifyToken, checkRole(['farmer', 'admin']), async (req, res, next) => {
    try {
      // On valide un tableau de produits
      const productsArray = z.array(insertProductSchema.omit({ farmerId: true })).parse(req.body);
      const created = [];
      
      for (const p of productsArray) {
        const newProd = await storage.createProduct({ 
          ...p, 
          farmerId: (req as any).user.id,
          availableQuantity: Number(p.quantity)
        });
        created.push(newProd);
      }
      res.status(201).json({ success: true, count: created.length });
    } catch (error) { next(error); }
  });
  app.get("/api/farmer/:farmerId/products", verifyToken, async (req, res, next) => {
    try {
      const products = await storage.getProductsByFarmer(Number(req.params.farmerId));
      res.json(products);
    } catch (error) { next(error); }
  });

  // --- COMMANDES ---
  app.post("/api/orders", verifyToken, async (req, res, next) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const product = await storage.getProduct(orderData.productId);
      if (!product || product.availableQuantity < orderData.quantity) {
        return res.status(400).json({ message: "Stock insuffisant" });
      }
      const order = await storage.createOrder({ ...orderData, buyerId: (req as any).user.id });
      await storage.updateProduct(product.id, { availableQuantity: product.availableQuantity - orderData.quantity });
      res.status(201).json(order);
    } catch (error) { next(error); }
  });

  app.get("/api/buyer/:buyerId/orders", verifyToken, async (req, res, next) => {
    try {
      const orders = await storage.getOrdersByBuyer(Number(req.params.buyerId));
      res.json(orders);
    } catch (error) { next(error); }
  });

  app.get("/api/farmer/:farmerId/orders", verifyToken, async (req, res, next) => {
    try {
      const orders = await storage.getOrdersByFarmer(Number(req.params.farmerId));
      res.json(orders);
    } catch (error) { next(error); }
  });

  app.patch("/api/orders/:id", verifyToken, async (req, res, next) => {
    try {
      const updateData = updateOrderSchema.parse(req.body);
      const updated = await storage.updateOrder(Number(req.params.id), updateData);
      res.json(updated);
    } catch (error) { next(error); }
  });

  // --- AVIS & CONTACTS ---
  app.get("/api/products/:productId/reviews", async (req, res, next) => {
    try {
      const reviews = await storage.getReviewsByProduct(Number(req.params.productId));
      res.json(reviews);
    } catch (error) { next(error); }
  });

  app.post("/api/reviews", verifyToken, async (req, res, next) => {
    try {
      const review = insertReviewSchema.parse(req.body);
      const created = await storage.createReview({ ...review, buyerId: (req as any).user.id });
      res.status(201).json(created);
    } catch (error) { next(error); }
  });

  app.post("/api/contacts", verifyToken, async (req, res, next) => {
    try {
      const contact = insertContactSchema.parse(req.body);
      const created = await storage.createContact({ ...contact, buyerId: (req as any).user.id });
      res.status(201).json(created);
    } catch (error) { next(error); }
  });

  app.get("/api/farmer/:farmerId/contacts", verifyToken, async (req, res, next) => {
    try {
      const contacts = await storage.getContactsByFarmer(Number(req.params.farmerId));
      res.json(contacts);
    } catch (error) { next(error); }
  });

  // --- ADMIN ---
  app.get("/api/admin/users", verifyToken, checkRole(['admin']), async (_req, res, next) => {
    try { res.json(await storage.getAllUsers()); } catch (error) { next(error); }
  });

  app.patch("/api/admin/products/:id/approve", verifyToken, checkRole(['admin']), async (req, res, next) => {
    try { res.json(await storage.approveProduct(Number(req.params.id))); } catch (error) { next(error); }
  });

  app.get("/api/stats", async (_req, res, next) => {
    try { res.json(await storage.getStats()); } catch (error) { next(error); }
  });
// --- ADMINISTRATION : GESTION UTILISATEURS ---
app.put("/api/admin/users/:id", verifyToken, checkRole(['admin']), async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const updateData = req.body; // Zod validation can be added here
    const updatedUser = await storage.updateUser(userId, updateData);
    res.json(updatedUser);
  } catch (error) { next(error); }
});
  // --- DONNÉES STATIQUES ---
app.get("/api/communes", (_req, res) => {
  res.json(["Annexe", "Lubumbashi", "Kenya", "Katuba", "Kamalondo", "Kampemba", "Ruashi"]);
});

app.get("/api/categories", (_req, res) => {
  res.json(["Maraîchage", "Céréales", "Légumineuses", "Tubercules", "Élevage", "Fruits"]);
});

  app.use("/api/uploads", uploadsRouter);
  app.use(errorHandler);

  return createServer(app);
}