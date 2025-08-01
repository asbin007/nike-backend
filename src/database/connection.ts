import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config.ts";
import Category from "./models/categoryModel.ts";
import ProductReview from "./models/productReviewModal.ts";
import Shoe from "./models/productModel.ts";
import User from "./models/userModel.ts";
import Collection from "./models/collectionModel.ts";
import Cart from "./models/cartModel.ts";
import Order from "./models/orderModel.ts";
import Payment from "./models/paymentModel.ts";
import OrderDetails from "./models/orderDetaills.ts"; 
import Chat from "./models/chatModel.ts";
import Message from "./models/messageModel.ts";

// Simple database configuration
const dialectOptions: any = {};

// Configure SSL based on environment
if (process.env.NODE_ENV === 'production') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
} else {
  dialectOptions.ssl = false;
}

// Create Sequelize instance
const sequelize = new Sequelize(envConfig.databaseUrl as string, {
  models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
  logging: false,
  dialectOptions,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Database connection function
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    
    if (process.env.NODE_ENV === 'production') {
      console.log("⚠️  Continuing without database connection...");
      return false;
    } else {
      console.error("💥 Exiting due to database connection failure in development");
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDatabase();

// ===== DATABASE RELATIONSHIPS =====

// Category x Product
Shoe.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Shoe, { foreignKey: "categoryId" });

// Collection x Product
Shoe.belongsTo(Collection, { foreignKey: "collectionId" });
Collection.hasMany(Shoe, { foreignKey: "collectionId" });

// User x Review
ProductReview.belongsTo(User, { foreignKey: "userId" });
User.hasMany(ProductReview, { foreignKey: "userId" });

// Product x Review
ProductReview.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(ProductReview, { foreignKey: "productId" });

// Product x Cart
Cart.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(Cart, { foreignKey: "productId" });

// User x Cart
Cart.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Cart, { foreignKey: "userId" });

// Order x User
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId" });

// Payment x Order
Order.belongsTo(Payment, { foreignKey: "paymentId" });
Payment.hasOne(Order, { foreignKey: "paymentId" });

// Order x OrderDetails
OrderDetails.belongsTo(Order, { foreignKey: "orderId" });
Order.hasOne(OrderDetails, { foreignKey: "orderId" });

// OrderDetails x Product
OrderDetails.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(OrderDetails, { foreignKey: "productId" });

// ===== CHAT RELATIONSHIPS =====

// Chat relations
Chat.belongsTo(User, { as: "Customer", foreignKey: "customerId" });
Chat.belongsTo(User, { as: "Admin", foreignKey: "adminId" });

User.hasMany(Chat, { as: "CustomerChats", foreignKey: "customerId" });
User.hasMany(Chat, { as: "AdminChats", foreignKey: "adminId" });

// Message relations
Message.belongsTo(Chat, { foreignKey: "chatId" });
Chat.hasMany(Message, { foreignKey: "chatId" });

Message.belongsTo(User, { as: "Sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "Receiver", foreignKey: "receiverId" });

User.hasMany(Message, { as: "SentMessages", foreignKey: "senderId" });
User.hasMany(Message, { as: "ReceivedMessages", foreignKey: "receiverId" });

export default sequelize;
