import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // ✅ Force IPv4 DNS resolution

import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config.js";

import Category from "./models/categoryModel.js";
import ProductReview from "./models/productReviewModal.js";
import Shoe from "./models/productModel.js";
import User from "./models/userModel.js";
import Collection from "./models/collectionModel.js";
import Cart from "./models/cartModel.js";
import Order from "./models/orderModel.js";
import Payment from "./models/paymentModel.js";
import OrderDetails from "./models/orderDetaills.js";
import Chat from "./models/chatModel.js";
import Message from "./models/messageModel.js";

// ✅ Use SSL for Render PostgreSQL
const sequelize = new Sequelize(envConfig.dbUrl as string, {
  models: [
    Category, 
    ProductReview,
    Shoe,
    User,
    Collection,
    Cart,
    Order,
    Payment,
    OrderDetails,
    Chat,
    Message,
  ],
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

// ✅ Connect and sync DB
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Unable to connect to the database:", err));

sequelize
  .sync({ force: false, alter: false })
  .then(() => console.log("✅ Database synchronized successfully"))
  .catch((err) => console.error("❌ Error syncing database:", err));

// ===== DATABASE RELATIONSHIPS =====

// Category x Product
Shoe.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Shoe, { foreignKey: "categoryId" });

// Collection x Product
Shoe.belongsTo(Collection, { foreignKey: "collectionId" });
Collection.hasMany(Shoe, { foreignKey: "collectionId" });

// User x Review
ProductReview.belongsTo(User, { foreignKey: "userId" });
User.hasMany(ProductReview, { foreignKey: "userId", onDelete: 'CASCADE' });

// Product x Review
ProductReview.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(ProductReview, { foreignKey: "productId" });

// Product x Cart
Cart.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(Cart, { foreignKey: "productId" });

// User x Cart
Cart.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Cart, { foreignKey: "userId", onDelete: 'CASCADE' });

// Order x User
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId", onDelete: 'CASCADE' });

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

// Chat x Users
Chat.belongsTo(User, { as: "Customer", foreignKey: "customerId" });
Chat.belongsTo(User, { as: "Admin", foreignKey: "adminId" });

User.hasMany(Chat, { as: "CustomerChats", foreignKey: "customerId", onDelete: 'CASCADE' });
User.hasMany(Chat, { as: "AdminChats", foreignKey: "adminId", onDelete: 'CASCADE' });

// Message x Chat
Message.belongsTo(Chat, { foreignKey: "chatId" });
Chat.hasMany(Message, { foreignKey: "chatId" });

// Message x User
Message.belongsTo(User, { as: "Sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "Receiver", foreignKey: "receiverId" });

User.hasMany(Message, { as: "SentMessages", foreignKey: "senderId", onDelete: 'CASCADE' });
User.hasMany(Message, { as: "ReceivedMessages", foreignKey: "receiverId", onDelete: 'CASCADE' });

export default sequelize;
