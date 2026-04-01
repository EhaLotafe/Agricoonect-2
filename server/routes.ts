// server/routes.ts
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
  insertSurveySchema,
} from "@shared/schema";
import jwt from "jsonwebtoken";
import uploadsRouter from "./uploads";

const SECRET_KEY = process.env.JWT_SECRET || "lubum_agri_2025_secret";

// --- 🛡️ MIDDLEWARES DE SÉCURISATION ---

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
  console.error("❌ Erreur Serveur:", err);
  if (err?.name === "ZodError") {
    return res.status(400).json({ message: "Données invalides", issues: err.issues });
  }
  res.status(err.status || 500).json({ message: err.message || "Erreur interne" });
}

export async function registerRoutes(app: express.Express): Promise<Server> {
  
  // --- 👤 AUTHENTIFICATION ---

  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      const token = jwt.sign({ id: user.id, email: user.email, userType: user.userType }, SECRET_KEY, { expiresIn: "30d" });
      const { password: _, ...userResponse } = user;
      res.status(201).json({ user: userResponse, token });
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

  // --- 📊 SONDAGES & MARKET INTELLIGENCE ---

  app.post("/api/surveys", verifyToken, checkRole(['buyer']), async (req, res, next) => {
    try {
      const data = insertSurveySchema.parse(req.body);
      const survey = await storage.createSurvey({ ...data, buyerId: (req as any).user.id });
      res.status(201).json(survey);
    } catch (error) { next(error); }
  });

  app.get("/api/market-trends", verifyToken, checkRole(['farmer', 'admin']), async (_req, res, next) => {
    try {
      const trends = await storage.getMarketTrends();
      res.json(trends);
    } catch (error) { next(error); }
  });

  app.get("/api/market-trends/price/:product", async (req, res, next) => {
    try {
      const avgPrice = await storage.getAverageTargetPrice(req.params.product);
      res.json({ product: req.params.product, averageTargetPrice: avgPrice });
    } catch (error) { next(error); }
  });

  // --- 🍎 PRODUITS (CORRECTION ERREUR 500) ---

  app.get("/api/products", async (req, res, next) => {
    try {
      const { category, commune, search, approved } = req.query;
      
      // ✅ FIX : Conversion explicite pour éviter l'erreur 500 en DB
      const filters: any = {};
      if (approved === "true") filters.isApproved = true;
      else if (approved === "false") filters.isApproved = false;
      else filters.isApproved = true; // Par défaut on ne montre que les validés

      if (category && category !== "all") filters.category = category;
      if (commune && commune !== "all") filters.commune = commune;
      if (search) filters.search = search;

      const products = await storage.getAllProducts(filters);
      res.json(products);
    } catch (error) { next(error); }
  });

  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const product = await storage.getProductWithFarmer(Number(req.params.id));
      if (!product) return res.status(404).json({ message: "Produit non trouvé" });
      res.json(product);
    } catch (error) { next(error); }
  });

  app.post("/api/products", verifyToken, checkRole(['farmer', 'admin']), async (req, res, next) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({ 
        ...data, 
        farmerId: (req as any).user.id,
        availableQuantity: Number(data.quantity)
      });
      res.status(201).json(product);
    } catch (error) { next(error); }
  });

  // --- 💰 COMMANDES & SUIVI (CORRECTION ERREUR 403) ---

  app.post("/api/orders", verifyToken, checkRole(['buyer']), async (req, res, next) => {
    try {
      const orderData = insertOrderSchema.omit({ buyerId: true }).parse(req.body);
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
      const authenticatedUser = (req as any).user;
      const requestedId = Number(req.params.buyerId);

      // Log de debug (Regardez votre terminal VS Code/Serveur après avoir cliqué)
      console.log(`🔐 Tentative d'accès commandes : AuthUser ID ${authenticatedUser.id} vs Requested ID ${requestedId}`);

      // ✅ FIX : On force Number() sur les deux côtés pour éviter le 403 injustifié
      if (Number(authenticatedUser.id) !== requestedId && authenticatedUser.userType !== 'admin') {
        return res.status(403).json({ 
          message: "Accès refusé : Vous ne pouvez consulter que vos propres commandes." 
        });
      }

      const orders = await storage.getOrdersByBuyer(requestedId);
      res.json(orders);
    } catch (error) { 
      console.error("Erreur orders :", error);
      next(error); 
    }
  });



  app.get("/api/farmer/:farmerId/orders", verifyToken, checkRole(['farmer', 'admin']), async (req, res, next) => {
    try {
      const authenticatedUser = (req as any).user;
      const requestedId = Number(req.params.farmerId);

      if (authenticatedUser.id !== requestedId && authenticatedUser.userType !== 'admin') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      res.json(await storage.getOrdersByFarmer(requestedId)); 
    } catch (error) { next(error); }
  });

  // --- 👑 ADMINISTRATION ---

  app.get("/api/admin/users", verifyToken, checkRole(['admin']), async (_req, res, next) => {
    try { res.json(await storage.getAllUsers()); } catch (error) { next(error); }
  });

  app.patch("/api/admin/products/:id/approve", verifyToken, checkRole(['admin']), async (req, res, next) => {
    try { res.json(await storage.approveProduct(Number(req.params.id))); } catch (error) { next(error); }
  });

  app.get("/api/stats", async (_req, res, next) => {
    try { res.json(await storage.getStats()); } catch (error) { next(error); }
  });

  // --- 📦 RÉFÉRENTIELS ---

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