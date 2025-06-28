import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, insertOrderSchema, insertUserSchema, 
  insertRoleSchema, insertTransactionSchema, insertSettingSchema,
  insertUserInfoSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const district = req.query.district as string;
      const products = await storage.getProducts(district);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, data);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const district = req.query.district as string;
      const orders = await storage.getOrders(district);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/pending", async (req, res) => {
    try {
      const orders = await storage.getOrdersByPaymentStatus("Pending");
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const data = insertOrderSchema.parse(req.body);
      
      // Parse order details and validate stock
      const orderLines = data.orderDetails.split('\n').filter(line => line.trim());
      const productIds: number[] = [];
      let totalAmount = 0;

      for (const line of orderLines) {
        const parts = line.trim().split(' ');
        if (parts.length >= 5) {
          const productName = parts[0];
          const quantity = parseInt(parts[1]);
          const district = parts[2];
          const addedBy = parts[3];
          const uniqueNumber = parseInt(parts[4]);

          const product = await storage.getProductByNameDistrictUnique(productName, district, uniqueNumber);
          if (!product) {
            return res.status(400).json({ 
              error: `Product ${productName} not found in ${district} with unique number ${uniqueNumber}` 
            });
          }

          if (product.quantity < quantity) {
            return res.status(400).json({ 
              error: `Insufficient stock for ${productName} in ${district}. Available: ${product.quantity}, Requested: ${quantity}` 
            });
          }

          productIds.push(product.id);
          totalAmount += product.price * quantity;

          // Deduct stock
          await storage.updateProduct(product.id, { quantity: product.quantity - quantity });
        }
      }

      const order = await storage.createOrder({
        ...data,
        productIds: productIds.join(','),
        totalAmount
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, data);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Payment SMS processing
  app.post("/api/payments/process-sms", async (req, res) => {
    try {
      const { smsText, amount, phone } = req.body;

      if (!smsText || !amount || !phone) {
        return res.status(400).json({ error: "SMS text, amount, and phone are required" });
      }

      // Try to match with pending order
      const order = await storage.getOrderByAmountAndPhone(amount, phone);
      
      if (order && order.paymentStatus === "Pending") {
        // Update order payment status
        await storage.updateOrder(order.id, { paymentStatus: "Confirmed" });
        
        // Create transaction record
        await storage.createTransaction({
          amount,
          senderPhone: phone,
          smsPhone: phone,
          orderId: order.id,
          status: "Matched"
        });

        res.json({ 
          success: true, 
          message: `Payment confirmed for Order #${order.id}`,
          orderId: order.id 
        });
      } else {
        // Create unmatched transaction
        await storage.createTransaction({
          amount,
          senderPhone: phone,
          smsPhone: phone,
          status: "Unmatched"
        });

        res.json({ 
          success: false, 
          message: `No matching order found for Rs.${amount} from ${phone}` 
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process payment SMS" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const roles = await storage.getUserRoles(user.telegramId);
          return { ...user, roles };
        })
      );
      res.json(usersWithRoles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Roles
  app.post("/api/roles", async (req, res) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid role data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to assign role" });
    }
  });

  app.delete("/api/roles", async (req, res) => {
    try {
      const { telegramId, role } = req.body;
      const deleted = await storage.deleteRole(telegramId, role);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/unmatched", async (req, res) => {
    try {
      const transactions = await storage.getUnmatchedTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unmatched transactions" });
    }
  });

  // Settings
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const data = insertSettingSchema.parse(req.body);
      const setting = await storage.setSetting(data);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid setting data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // User Info
  app.get("/api/user-info/:telegramId", async (req, res) => {
    try {
      const userInfo = await storage.getUserInfo(req.params.telegramId);
      if (!userInfo) {
        return res.status(404).json({ error: "User info not found" });
      }
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  app.post("/api/user-info", async (req, res) => {
    try {
      const data = insertUserInfoSchema.parse(req.body);
      const userInfo = await storage.createOrUpdateUserInfo(data);
      res.json(userInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user info data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save user info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
