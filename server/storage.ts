import { bids, insertBidSchema, insertMessageSchema, insertProductSchema, insertTransportRequestSchema, messages, products, transportRequests, users, type Bid, type InsertBid, type InsertMessage, type InsertProduct, type InsertTransportRequest, type InsertUser, type Message, type Product, type TransportRequest, type User } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getPendingFarmerVerifications(): Promise<User[]>;
  
  // Product operations
  createProduct(product: InsertProduct & { farmerId: number }): Promise<Product>;
  getProducts(): Promise<Product[]>;
  getProductsByFarmerId(farmerId: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  
  // Bid operations
  createBid(bid: InsertBid & { buyerId: number }): Promise<Bid>;
  getBidsByProductId(productId: number): Promise<Bid[]>;
  getBidsByBuyerId(buyerId: number): Promise<Bid>;
  getBidById(id: number): Promise<Bid | undefined>;
  updateBidStatus(id: number, status: string): Promise<Bid | undefined>;
  
  // Transport operations
  createTransportRequest(request: InsertTransportRequest & { requesterId: number }): Promise<TransportRequest>;
  getTransportRequestsByRequesterId(requesterId: number): Promise<TransportRequest[]>;
  getTransportRequestsByTransporterId(transporterId: number): Promise<TransportRequest[]>;
  getTransportRequestById(id: number): Promise<TransportRequest | undefined>;
  updateTransportRequestStatus(id: number, status: string, transporterId?: number): Promise<TransportRequest | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getUnreadMessagesByUserId(userId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  // Maps to store data
  users: Map<number, User>; // Made public to allow access in routes.ts
  private products: Map<number, Product>;
  private bids: Map<number, Bid>;
  private transportRequests: Map<number, TransportRequest>;
  private messages: Map<number, Message>;
  
  // ID counters
  private userId: number;
  private productId: number;
  private bidId: number;
  private transportRequestId: number;
  private messageId: number;
  
  // Session store
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.bids = new Map();
    this.transportRequests = new Map();
    this.messages = new Map();
    
    this.userId = 1;
    this.productId = 1;
    this.bidId = 1;
    this.transportRequestId = 1;
    this.messageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user = { 
      ...insertUser, 
      id, 
      createdAt: new Date(), 
      profilePicture: null,
      phone: insertUser.phone || null,
      location: insertUser.location || null,
      // Initialize farmer-specific fields
      farmName: insertUser.farmName || null,
      farmBio: insertUser.farmBio || null,
      farmAddress: insertUser.farmAddress || null,
      verificationId: insertUser.verificationId || null,
      certifications: [],
      verificationStatus: "pending"
    };
    this.users.set(id, user as User);
    return user as User;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getPendingFarmerVerifications(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.role === "farmer" && user.verificationStatus === "pending" && user.verificationId
    );
  }

  // Product operations
  async createProduct(product: InsertProduct & { farmerId: number }): Promise<Product> {
    const id = this.productId++;
    const newProduct = {
      ...product,
      id,
      images: [] as string[],
      tags: [] as string[],
      status: "active",
      createdAt: new Date(),
      description: product.description || null
    };
    this.products.set(id, newProduct as Product);
    return newProduct as Product;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByFarmerId(farmerId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.farmerId === farmerId
    );
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Bid operations
  async createBid(bid: InsertBid & { buyerId: number }): Promise<Bid> {
    const id = this.bidId++;
    const newBid = {
      ...bid,
      id,
      status: "pending",
      createdAt: new Date(),
      message: bid.message || null
    };
    this.bids.set(id, newBid as Bid);
    return newBid as Bid;
  }

  async getBidsByProductId(productId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.productId === productId
    );
  }

  async getBidsByBuyerId(buyerId: number): Promise<any> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.buyerId === buyerId
    );
  }

  async getBidById(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }

  async updateBidStatus(id: number, status: string): Promise<Bid | undefined> {
    const bid = this.bids.get(id);
    if (!bid) return undefined;
    
    const updatedBid = { ...bid, status };
    this.bids.set(id, updatedBid);
    return updatedBid;
  }

  // Transport operations
  async createTransportRequest(request: InsertTransportRequest & { requesterId: number }): Promise<TransportRequest> {
    const id = this.transportRequestId++;
    const newRequest = {
      ...request,
      id,
      transporterId: null,
      status: "pending",
      createdAt: new Date()
    };
    this.transportRequests.set(id, newRequest as TransportRequest);
    return newRequest as TransportRequest;
  }

  async getTransportRequestsByRequesterId(requesterId: number): Promise<TransportRequest[]> {
    return Array.from(this.transportRequests.values()).filter(
      (request) => request.requesterId === requesterId
    );
  }

  async getTransportRequestsByTransporterId(transporterId: number): Promise<TransportRequest[]> {
    return Array.from(this.transportRequests.values()).filter(
      (request) => request.transporterId === transporterId
    );
  }

  async getTransportRequestById(id: number): Promise<TransportRequest | undefined> {
    return this.transportRequests.get(id);
  }

  async updateTransportRequestStatus(id: number, status: string, transporterId?: number): Promise<TransportRequest | undefined> {
    const request = this.transportRequests.get(id);
    if (!request) return undefined;
    
    const updates: Partial<TransportRequest> = { status };
    if (transporterId) {
      updates.transporterId = transporterId;
    }
    
    const updatedRequest = { ...request, ...updates };
    this.transportRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Message operations
  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const id = this.messageId++;
    const newMessage = {
      ...message,
      id,
      read: false,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage as Message);
    return newMessage as Message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) || 
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });
  }

  async getUnreadMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === userId && !message.read
    );
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();