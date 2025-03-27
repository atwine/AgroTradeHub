import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role-based system
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("buyer"), // admin, farmer, buyer, middleman, transporter
  location: text("location"),
  profilePicture: text("profile_picture"),
  
  // Farmer specific fields
  farmName: text("farm_name"),
  farmBio: text("farm_bio"),
  farmAddress: text("farm_address"),
  verificationId: text("verification_id"), // Government ID or farm association ID
  certifications: jsonb("certifications").$type<string[]>().default([]), // e.g., organic, fair trade
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, profilePicture: true, createdAt: true, certifications: true, verificationStatus: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Please enter a valid email"),
    role: z.enum(["admin", "farmer", "buyer", "middleman", "transporter"], {
      errorMap: () => ({ message: "Please select a valid role" }),
    }),
    // Make farmer-specific fields optional in the schema
    farmName: z.string().optional(),
    farmBio: z.string().optional(),
    farmAddress: z.string().optional(),
    verificationId: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Product schema for agricultural products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull(), // amount
  unit: text("unit").notNull().default("kg"), // kg, tonne, liter, quintal, etc.
  price: real("price").notNull(), // price per unit
  location: text("location").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: text("status").notNull().default("active"), // active, sold, expired
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, farmerId: true, images: true, createdAt: true, status: true })
  .extend({
    quantity: z.number().positive("Quantity must be positive"),
    price: z.number().positive("Price must be positive"),
    unit: z.enum(["kg", "tonne", "quintal", "liter", "pound", "piece"], {
      errorMap: () => ({ message: "Please select a valid unit" }),
    }),
    category: z.enum(["Grains", "Vegetables", "Fruits", "Pulses", "Dairy", "Other"], {
      errorMap: () => ({ message: "Please select a valid category" }),
    }),
  });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Bids schema for offers on products
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  amount: real("amount").notNull(), // per quintal
  quantity: real("quantity").notNull(), // in quintals
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, countered
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids)
  .omit({ id: true, buyerId: true, createdAt: true, status: true })
  .extend({
    amount: z.number().positive("Bid amount must be positive"),
    quantity: z.number().positive("Quantity must be positive"),
  });

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

// Transport requests for product delivery
export const transportRequests = pgTable("transport_requests", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  requesterId: integer("requester_id").notNull(), // could be farmer or buyer
  transporterId: integer("transporter_id"),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  quantity: real("quantity").notNull(), // in quintals
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, in_transit, delivered
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransportRequestSchema = createInsertSchema(transportRequests)
  .omit({ id: true, requesterId: true, transporterId: true, createdAt: true, status: true })
  .extend({
    quantity: z.number().positive("Quantity must be positive"),
    date: z.coerce.date().min(new Date(), "Date must be in the future"),
  });

export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;

// Messages for communication between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, senderId: true, createdAt: true, read: true })
  .extend({
    content: z.string().min(1, "Message cannot be empty"),
  });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
