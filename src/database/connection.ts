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
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});


sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

sequelize.sync({ force: false, alter: false}).then(() => {
  console.log("Database synchronized successfully");
});

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
