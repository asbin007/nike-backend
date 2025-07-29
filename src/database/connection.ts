import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config";
import Category from "./models/categoryModel";
import ProductReview from "./models/productReviewModal";
import Shoe from "./models/productModel";
import User from "./models/userModel";
import Collection from "./models/collectionModel";
import Cart from "./models/cartModel";
import Order from "./models/orderModel";
import Payment from "./models/paymentModel";
import OrderDetails from "./models/orderDetaills"; 
import Chat from "./models/chatModel";
import Message from "./models/messageModel";

// Check if database URL exists
if (!envConfig.databaseUrl) {
  console.error("DATABASE_URL environment variable is not set!");
  process.exit(1);
}

const sequelize = new Sequelize(envConfig.databaseUrl as string, {
  models: [__dirname + "/models"],
  logging: false, // Disable logging in production
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

sequelize.sync({ force: false, alter: true }).then(() => {
  console.log("Database synced successfully");
});

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
