import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
  models: [join(__dirname, "models")],
  logging: false, // Disable logging in production
  dialectOptions
});

try {
  sequelize
    .authenticate()
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.log("Database connection failed", error);
    });
} catch (error) {
  console.log("Database connection failed", error);
  process.exit(1);
}

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
