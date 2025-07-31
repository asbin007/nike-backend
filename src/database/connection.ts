import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config.ts";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if database URL exists
if (!envConfig.databaseUrl) {
  console.error("DATABASE_URL environment variable is not set!");
  console.error("Please set DATABASE_URL in Render environment variables");
  // Don't exit in production, let the app start without database
  if (process.env.NODE_ENV === 'production') {
    console.log("Starting without database connection...");
  } else {
    process.exit(1);
  }
}

// Configure SSL based on environment
const dialectOptions: any = {};
if (process.env.NODE_ENV === 'production') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
} else {
  // Disable SSL for development
  dialectOptions.ssl = false;
}

const sequelize = new Sequelize(envConfig.databaseUrl as string, {
  models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
  logging: false, // Disable logging in production
  dialectOptions
});

// Temporarily disable database authentication for deployment
console.log("Database authentication temporarily disabled for deployment");
// try {
//   sequelize
//     .authenticate()
//     .then(() => {
//       console.log("Database connected successfully");
//     })
//     .catch((error) => {
//       console.log("Database connection failed", error);
//     });
// } catch (error) {
//   console.log("Database connection failed", error);
//   process.exit(1);
// }

// category x product
Shoe.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Shoe, { foreignKey: "categoryId" });

// collection x product
Shoe.belongsTo(Collection, { foreignKey: "collectionId" });
Collection.hasMany(Shoe, { foreignKey: "collectionId" });

// user x review
ProductReview.belongsTo(User, { foreignKey: "userId" });
User.hasMany(ProductReview, { foreignKey: "userId" });

// product x review
ProductReview.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(ProductReview, { foreignKey: "productId" });

// product x cart
Cart.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(Cart, { foreignKey: "productId" });

// user x cart
Cart.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Cart, { foreignKey: "userId" });

// order x user
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId" });

// payment x order
Order.belongsTo(Payment, { foreignKey: "paymentId" });
Payment.hasOne(Order, { foreignKey: "paymentId" });

// order x orderDetails
OrderDetails.belongsTo(Order, { foreignKey: "orderId" });
Order.hasOne(OrderDetails, { foreignKey: "orderId" });

// orderDetails x product
OrderDetails.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(OrderDetails, { foreignKey: "productId" });


// for chat
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
