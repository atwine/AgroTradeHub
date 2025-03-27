import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertBidSchema, insertMessageSchema, insertProductSchema, insertTransportRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up auth routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  const httpServer = createServer(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send("Unauthorized");
  };
  
  // Middleware to check if user is a farmer
  const isFarmer = (req: any, res: any, next: any) => {
    if (req.user.role === "farmer") {
      return next();
    }
    res.status(403).send("Only farmers can access this resource");
  };
  
  // Middleware to check if user is an admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role === "admin") {
      return next();
    }
    res.status(403).send("Only admins can access this resource");
  };

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "farmer") {
        return res.status(403).json({ message: "Only farmers can create products" });
      }
      
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...validated,
        farmerId: req.user.id,
      });
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.get("/api/user/products", isAuthenticated, async (req: any, res) => {
    try {
      const products = await storage.getProductsByFarmerId(req.user.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });
  
  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user is the farmer who owns this product
      if (product.farmerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this product" });
      }
      
      // Validate request body
      const validated = insertProductSchema.partial().parse(req.body);
      
      // Create a safe update object, ensuring tags is properly handled
      const updateData = {
        ...validated,
        tags: Array.isArray(req.body.tags) ? req.body.tags : undefined
      };
      
      // Update the product
      const updatedProduct = await storage.updateProduct(productId, updateData);
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // Bids API
  app.post("/api/bids", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "buyer" && req.user.role !== "middleman") {
        return res.status(403).json({ message: "Only buyers and middlemen can place bids" });
      }
      
      const validated = insertBidSchema.parse(req.body);
      
      // Check if product exists
      const product = await storage.getProductById(validated.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.status !== "active") {
        return res.status(400).json({ message: "Product is not available for bidding" });
      }
      
      const bid = await storage.createBid({
        ...validated,
        buyerId: req.user.id,
      });
      
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating bid" });
    }
  });

  app.get("/api/products/:id/bids", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const bids = await storage.getBidsByProductId(productId);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bids" });
    }
  });

  app.get("/api/user/bids", isAuthenticated, async (req: any, res) => {
    try {
      const bids = await storage.getBidsByBuyerId(req.user.id);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bids" });
    }
  });

  app.patch("/api/bids/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["accepted", "rejected", "countered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const bid = await storage.getBidById(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      const product = await storage.getProductById(bid.productId);
      if (!product || product.farmerId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this bid" });
      }
      
      const updatedBid = await storage.updateBidStatus(bidId, status);
      
      // If bid is accepted, mark product as sold
      if (status === "accepted") {
        await storage.updateProduct(product.id, { status: "sold" });
      }
      
      res.json(updatedBid);
    } catch (error) {
      res.status(500).json({ message: "Error updating bid status" });
    }
  });

  // Transport API
  app.post("/api/transport", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "farmer" && req.user.role !== "buyer" && req.user.role !== "middleman") {
        return res.status(403).json({ message: "Only farmers, buyers, and middlemen can create transport requests" });
      }
      
      const validated = insertTransportRequestSchema.parse(req.body);
      
      // Check if product exists
      const product = await storage.getProductById(validated.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const request = await storage.createTransportRequest({
        ...validated,
        requesterId: req.user.id,
      });
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating transport request" });
    }
  });

  app.get("/api/transport/requester", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getTransportRequestsByRequesterId(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transport requests" });
    }
  });

  app.get("/api/transport/transporter", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "transporter") {
        return res.status(403).json({ message: "Only transporters can view their transport requests" });
      }
      
      const requests = await storage.getTransportRequestsByTransporterId(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transport requests" });
    }
  });

  app.get("/api/transport/available", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "transporter") {
        return res.status(403).json({ message: "Only transporters can view available transport requests" });
      }
      
      const allRequests = await storage.getProducts();
      const availableRequests = Array.from(allRequests.values()).filter(
        (request: any) => request.transporterId === null && request.status === "pending"
      );
      
      res.json(availableRequests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching available transport requests" });
    }
  });

  app.patch("/api/transport/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["accepted", "in_transit", "delivered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const request = await storage.getTransportRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Transport request not found" });
      }
      
      if (req.user.role === "transporter") {
        if (status === "accepted" && request.transporterId === null) {
          const updatedRequest = await storage.updateTransportRequestStatus(requestId, status, req.user.id);
          return res.json(updatedRequest);
        } else if (request.transporterId === req.user.id) {
          const updatedRequest = await storage.updateTransportRequestStatus(requestId, status);
          return res.json(updatedRequest);
        } else {
          return res.status(403).json({ message: "You don't have permission to update this transport request" });
        }
      } else if (req.user.id === request.requesterId) {
        const updatedRequest = await storage.updateTransportRequestStatus(requestId, status);
        return res.json(updatedRequest);
      } else {
        return res.status(403).json({ message: "You don't have permission to update this transport request" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating transport request status" });
    }
  });

  // Messages API
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertMessageSchema.parse(req.body);
      
      // Check if receiver exists
      const receiver = await storage.getUser(validated.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      const message = await storage.createMessage({
        ...validated,
        senderId: req.user.id,
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error sending message" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      
      // Check if user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.get("/api/messages/unread", isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getUnreadMessagesByUserId(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching unread messages" });
    }
  });

  app.patch("/api/messages/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      const message = await storage.markMessageAsRead(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to mark this message as read" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Error marking message as read" });
    }
  });

  // Farmer Profile API
  
  // Update farmer profile
  app.patch("/api/farmer/profile", isAuthenticated, isFarmer, async (req: any, res) => {
    try {
      const { farmName, farmBio, farmAddress } = req.body;
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Build updates object with only provided fields
      const updates: any = {};
      if (farmName !== undefined) updates.farmName = farmName;
      if (farmBio !== undefined) updates.farmBio = farmBio;
      if (farmAddress !== undefined) updates.farmAddress = farmAddress;
      
      // Update user in storage
      const updatedUser = await storage.updateUser(user.id, updates);
      
      res.json({
        farmName: updatedUser?.farmName,
        farmBio: updatedUser?.farmBio,
        farmAddress: updatedUser?.farmAddress
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating farmer profile" });
    }
  });
  
  // Submit verification ID
  app.post("/api/farmer/verification", isAuthenticated, isFarmer, async (req: any, res) => {
    try {
      const { verificationId } = req.body;
      
      if (!verificationId) {
        return res.status(400).json({ message: "Verification ID is required" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update verification ID and reset status to pending
      const updates = {
        verificationId,
        verificationStatus: "pending" 
      };
      
      const updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ 
        verificationId: updatedUser.verificationId,
        verificationStatus: updatedUser.verificationStatus
      });
    } catch (error) {
      res.status(500).json({ message: "Error submitting verification ID" });
    }
  });
  
  // Add or remove certifications
  app.patch("/api/farmer/certifications", isAuthenticated, isFarmer, async (req: any, res) => {
    try {
      const { action, certification } = req.body;
      
      if (!action || !certification || !["add", "remove"].includes(action)) {
        return res.status(400).json({ message: "Invalid request. Provide action (add/remove) and certification" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let updatedCertifications = [...(user.certifications || [])];
      
      if (action === "add" && !updatedCertifications.includes(certification)) {
        updatedCertifications.push(certification);
      } else if (action === "remove") {
        updatedCertifications = updatedCertifications.filter(cert => cert !== certification);
      }
      
      // Update certifications
      const updatedUser = await storage.updateUser(user.id, { certifications: updatedCertifications });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update certifications" });
      }
      
      res.json({ certifications: updatedUser.certifications });
    } catch (error) {
      res.status(500).json({ message: "Error updating certifications" });
    }
  });
  
  // Admin verification endpoints
  app.get("/api/admin/verifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingVerifications = await storage.getPendingFarmerVerifications();
      
      res.json(pendingVerifications.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        verificationId: user.verificationId,
        farmName: user.farmName,
        farmAddress: user.farmAddress
      })));
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending verifications" });
    }
  });
  
  app.patch("/api/admin/verifications/:userId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { status } = req.body;
      
      if (!status || !["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "farmer") {
        return res.status(400).json({ message: "User is not a farmer" });
      }
      
      // Update verification status
      const updatedUser = await storage.updateUser(userId, { verificationStatus: status });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update verification status" });
      }
      
      res.json({ id: updatedUser.id, verificationStatus: updatedUser.verificationStatus });
    } catch (error) {
      res.status(500).json({ message: "Error updating verification status" });
    }
  });

  return httpServer;
}
