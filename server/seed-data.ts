import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedData() {
  try {
    console.log("Seeding data...");
    
    // Create users for each role
    const farmerUser = await createUserIfNotExists({
      username: "farmer1",
      password: "password",
      fullName: "John Farmer",
      email: "john@agrifarm.com",
      role: "farmer",
      phone: "+1234567891",
      location: "Rural County, Midwest"
    });
    
    const buyerUser = await createUserIfNotExists({
      username: "buyer1",
      password: "password",
      fullName: "Emma Buyer",
      email: "emma@foodstore.com",
      role: "buyer",
      phone: "+1234567892",
      location: "Metro City, East Coast"
    });
    
    const middlemanUser = await createUserIfNotExists({
      username: "middleman1",
      password: "password",
      fullName: "Michael Broker",
      email: "michael@agribroker.com",
      role: "middleman",
      phone: "+1234567893",
      location: "Trade Center, West Coast"
    });
    
    const transporterUser = await createUserIfNotExists({
      username: "transporter1",
      password: "password",
      fullName: "Sara Trucker",
      email: "sara@transportco.com",
      role: "transporter",
      phone: "+1234567894",
      location: "Highway Junction, South"
    });
    
    // Create some products by the farmer
    if (farmerUser) {
      const wheatProduct = await createProductIfNotExists({
        farmerId: farmerUser.id,
        name: "Premium Wheat",
        category: "Grains",
        description: "High-quality wheat grown using sustainable practices",
        quantity: 100,
        price: 20.5,
        location: "Rural County, Midwest",
        images: ["https://images.unsplash.com/photo-1574323347407-f5e1ed40c17c?ixlib=rb-4.0.3"],
        tags: ["organic", "sustainable", "wheat"]
      });
      
      const cornProduct = await createProductIfNotExists({
        farmerId: farmerUser.id,
        name: "Sweet Corn",
        category: "Vegetables",
        description: "Freshly harvested sweet corn, perfect for direct consumption",
        quantity: 50,
        price: 15.75,
        location: "Rural County, Midwest",
        images: ["https://images.unsplash.com/photo-1551754655-cd27e38d2076?ixlib=rb-4.0.3"],
        tags: ["fresh", "corn", "vegetable"]
      });
      
      const tomatoProduct = await createProductIfNotExists({
        farmerId: farmerUser.id,
        name: "Heirloom Tomatoes",
        category: "Vegetables",
        description: "Variety of heirloom tomatoes, perfect for restaurants and specialty stores",
        quantity: 30,
        price: 25.0,
        location: "Rural County, Midwest",
        images: ["https://images.unsplash.com/photo-1582284540020-8acbe03f4924?ixlib=rb-4.0.3"],
        tags: ["heirloom", "tomato", "specialty"]
      });
      
      // Create bids on products if buyer exists
      if (buyerUser && wheatProduct) {
        await createBidIfNotExists({
          productId: wheatProduct.id,
          buyerId: buyerUser.id,
          amount: 19.0,
          quantity: 50,
          message: "I'd like to purchase half of your wheat stock for my bakery."
        });
      }
      
      if (middlemanUser && wheatProduct) {
        await createBidIfNotExists({
          productId: wheatProduct.id,
          buyerId: middlemanUser.id,
          amount: 19.5,
          quantity: 75,
          message: "Representing a chain of bakeries interested in your wheat."
        });
      }
      
      if (buyerUser && tomatoProduct) {
        await createBidIfNotExists({
          productId: tomatoProduct.id,
          buyerId: buyerUser.id,
          amount: 24.0,
          quantity: 15,
          message: "Need these tomatoes for our restaurant's special menu."
        });
      }
      
      // Create transport requests
      if (buyerUser && wheatProduct) {
        await createTransportRequestIfNotExists({
          productId: wheatProduct.id,
          requesterId: buyerUser.id,
          pickupLocation: "Rural County, Midwest",
          deliveryLocation: "Metro City, East Coast",
          quantity: 50,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
      }
      
      // Create some messages between users
      if (buyerUser && farmerUser) {
        await createMessageIfNotExists({
          senderId: buyerUser.id,
          receiverId: farmerUser.id,
          content: "Hi, I'm interested in buying more wheat next season. What are your projected yields?"
        });
        
        await createMessageIfNotExists({
          senderId: farmerUser.id,
          receiverId: buyerUser.id,
          content: "Hello! I expect to have around 150-200 quintals available. Would you like to place a pre-order?"
        });
      }
      
      if (transporterUser && buyerUser) {
        await createMessageIfNotExists({
          senderId: transporterUser.id,
          receiverId: buyerUser.id,
          content: "I saw your transport request for wheat. I have availability next week."
        });
      }
    }
    
    console.log("Data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

// Helper functions to create entities if they don't exist
async function createUserIfNotExists(userData: any) {
  const existingUser = await storage.getUserByUsername(userData.username);
  if (!existingUser) {
    const hashedPassword = await hashPassword(userData.password);
    return await storage.createUser({
      ...userData,
      password: hashedPassword
    });
  }
  return existingUser;
}

async function createProductIfNotExists(productData: any) {
  const existingProducts = await storage.getProductsByFarmerId(productData.farmerId);
  const existingProduct = existingProducts.find(p => p.name === productData.name);
  if (!existingProduct) {
    return await storage.createProduct(productData);
  }
  return existingProduct;
}

async function createBidIfNotExists(bidData: any) {
  const productBids = await storage.getBidsByProductId(bidData.productId);
  const existingBid = productBids.find(b => 
    b.buyerId === bidData.buyerId && 
    b.amount === bidData.amount && 
    b.quantity === bidData.quantity
  );
  if (!existingBid) {
    return await storage.createBid(bidData);
  }
  return existingBid;
}

async function createTransportRequestIfNotExists(requestData: any) {
  const requests = await storage.getTransportRequestsByRequesterId(requestData.requesterId);
  const existingRequest = requests.find(r => 
    r.productId === requestData.productId && 
    r.pickupLocation === requestData.pickupLocation &&
    r.deliveryLocation === requestData.deliveryLocation
  );
  if (!existingRequest) {
    return await storage.createTransportRequest(requestData);
  }
  return existingRequest;
}

async function createMessageIfNotExists(messageData: any) {
  const messages = await storage.getMessagesBetweenUsers(messageData.senderId, messageData.receiverId);
  const existingMessage = messages.find(m => 
    m.content === messageData.content && 
    m.senderId === messageData.senderId &&
    m.receiverId === messageData.receiverId
  );
  if (!existingMessage) {
    return await storage.createMessage(messageData);
  }
  return existingMessage;
}