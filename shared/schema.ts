import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  district: text("district").notNull(),
  addedBy: text("added_by").notNull(),
  price: integer("price").notNull(),
  uniqueNumber: integer("unique_number").notNull(),
  category: text("category").notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  orderDetails: text("order_details").notNull(),
  productIds: text("product_ids").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  orderStatus: text("order_status").notNull().default("Processing"),
  phone: text("phone").notNull(),
  dateOrdered: text("date_ordered").notNull(),
  createdAt: text("created_at").notNull(),
  district: text("district").notNull(),
});

// Users table
export const users = pgTable("users", {
  telegramId: text("telegram_id").primaryKey(),
  name: text("name").notNull(),
  primaryPhone: text("primary_phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  district: text("district").notNull(),
  registeredAt: text("registered_at").notNull(),
  language: text("language").notNull().default("English"),
});

// Roles table
export const roles = pgTable("roles", {
  telegramId: text("telegram_id").notNull(),
  role: text("role").notNull(),
  district: text("district"),
});

// Stock history table
export const stockHistory = pgTable("stock_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  action: text("action").notNull(),
  quantity: integer("quantity").notNull(),
  timestamp: text("timestamp").notNull(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  productId: integer("product_id").primaryKey(),
  stockValue: integer("stock_value").notNull().default(0),
});

// Raw transactions table
export const rawTransactions = pgTable("raw_transactions", {
  id: serial("id").primaryKey(),
  smsText: text("sms_text").notNull(),
  senderId: text("sender_id").notNull(),
  chatId: text("chat_id").notNull(),
  amount: real("amount").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: text("created_at").notNull(),
  note: text("note"),
  forwarderPhone: text("forwarder_phone"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: real("amount").notNull(),
  senderPhone: text("sender_phone").notNull(),
  upiId: text("upi_id"),
  transactionId: text("transaction_id"),
  smsPhone: text("sms_phone").notNull(),
  dateReceived: text("date_received").notNull(),
  orderId: integer("order_id"),
  status: text("status").notNull().default("Pending"),
  createdAt: text("created_at").notNull(),
  note: text("note"),
});

// Settings table
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// User info table
export const userInfo = pgTable("user_info", {
  telegramId: text("telegram_id").primaryKey(),
  name: text("name").notNull(),
  houseName: text("house_name"),
  landmark: text("landmark"),
  wardNo: text("ward_no"),
  panchayat: text("panchayat"),
  block: text("block"),
  subDistrict: text("sub_district"),
  district: text("district").notNull(),
  state: text("state").notNull(),
  primaryPhone: text("primary_phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  updatedAt: text("updated_at").notNull(),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  uniqueNumber: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  dateOrdered: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  registeredAt: true,
});

export const insertRoleSchema = createInsertSchema(roles);

export const insertStockHistorySchema = createInsertSchema(stockHistory).omit({
  id: true,
  timestamp: true,
});

export const insertInventorySchema = createInsertSchema(inventory);

export const insertRawTransactionSchema = createInsertSchema(rawTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  dateReceived: true,
});

export const insertSettingSchema = createInsertSchema(settings);

export const insertUserInfoSchema = createInsertSchema(userInfo).omit({
  updatedAt: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type RawTransaction = typeof rawTransactions.$inferSelect;
export type InsertRawTransaction = z.infer<typeof insertRawTransactionSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type UserInfo = typeof userInfo.$inferSelect;
export type InsertUserInfo = z.infer<typeof insertUserInfoSchema>;
