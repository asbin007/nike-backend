import http from 'http';
import { envConfig } from "./src/config/config.js";
import app from "./src/app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./src/database/models/userModel.js";
import Order from "./src/database/models/orderModel.js";
import Payment from "./src/database/models/paymentModel.js";
import Message from "./src/database/models/messageModel.js";
import Chat from "./src/database/models/chatModel.js";
import sequelize from "./src/database/connection.js";

function startServer() {
  try {
    console.log('Starting server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${envConfig.port}`);
    
    const server = app.listen(envConfig.port, async () => {
      console.log(`Server is running on port ${envConfig.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Wait for database sync to complete
      if (envConfig.databaseUrl) {
        try {
          // First try to authenticate
          await sequelize.authenticate();
          console.log("Database connection verified");
          
          // Then sync the database - use force: false and alter: false for production
          await sequelize.sync({ force: false, alter: false });
          console.log("Database synced successfully");
        } catch (error) {
          console.error('Error syncing database:', error);
          
          // In production, continue without database sync
          if (process.env.NODE_ENV === 'production') {
            console.log('Continuing without database sync in production...');
          } else {
            throw error; // Re-throw in development
          }
        }
      } else {
        console.log('Skipping database sync - no database connection');
      }
    });

    const io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173", 
          "http://localhost:3000",
          "https://nike-frontend.vercel.app",
          "https://nike-store-frontend.vercel.app",
          "*"
        ],
      },
    });

    // Export io for use in other modules
    (global as any).io = io;
    
    let activeUser: { socketId: string; userId: string; role: string }[] = [];
    let addToOnlineUsers = (socketId: string, userId: string, role: string) => {
      activeUser = activeUser.filter((user) => user.userId !== userId);
      activeUser.push({ socketId, userId, role });
    };

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      
      const { token } = socket.handshake.auth;
      if (token) {
        jwt.verify(
          token as string,
          envConfig.jwtSecret as string,
          async (err: any, result: any) => {
            if (err) {
              socket.emit("error", err);
              return;
            }
            const userData = await User.findByPk(result.userId);
            if (!userData) {
              socket.emit("error", "No user found with that token");
              return;
            }
            addToOnlineUsers(socket.id, result.userId, userData.role);
            
            socket.data = {
              userId: result.userId,
              role: userData.role,
              username: userData.username
            };
            
            console.log("User authenticated:", userData.username);
          }
        );
      } else {
        socket.emit("error", "Please provide token");
      }

      // Handle order status updates
      socket.on("updateOrderStatus", async (data) => {
        const { status, orderId, userId } = data;
        const findUser = activeUser.find((user) => user.userId == userId);
        
        await Order.update(
          { orderStatus: status },
          { where: { id: orderId } }
        );
        
        if (findUser) {
          io.to(findUser.socketId).emit("statusUpdated", data);
        } else {
          socket.emit("error", "User is not online!!");
        }
      });

      // Handle payment status updates
      socket.on("updatePaymentStatus", async (data) => {
        const { status, paymentId, userId } = data;
        const findUser = activeUser.find((user) => user.userId == userId);
        
        await Payment.update(
          { paymentStatus: status },
          { where: { id: paymentId } }
        );
        
        if (findUser) {
          io.to(findUser.socketId).emit("paymentStatusUpdated", {
            paymentId,
            status,
            message: "Payment status updated successfully",
          });
        } else {
          socket.emit("error", "User is not online to receive payment update!");
        }
      });

      // Handle chat functionality
      socket.on("joinChat", (chatId: string) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
      });

      socket.on("leaveChat", (chatId: string) => {
        socket.leave(chatId);
        console.log(`User left chat: ${chatId}`);
      });

      socket.on("sendMessage", async (data) => {
        const { chatId, content, imageUrl } = data;
        const senderId = socket.data?.userId;
        
        if (!chatId || (!content && !imageUrl) || !senderId) {
          socket.emit("error", "Chat ID, content or image, and sender ID are required");
          return;
        }

        try {
          const chat = await Chat.findOne({
            where: { 
              id: chatId,
              [socket.data?.role === 'admin' ? 'adminId' : 'customerId']: senderId 
            }
          });

          if (!chat) {
            socket.emit("error", "Access denied to this chat");
            return;
          }

          const receiverId = socket.data?.role === 'admin' ? chat.customerId : chat.adminId;

          const message = await Message.create({
            chatId,
            senderId,
            receiverId,
            content: content || "",
            imageUrl: imageUrl || null,
            read: false,
          });

          await chat.update({ updatedAt: new Date() });

          const messageWithUser = await Message.findOne({
            where: { id: message.id },
            include: [
              {
                model: User,
                as: "Sender",
                attributes: ["id", "username", "email", "role"],
              },
              {
                model: User,
                as: "Receiver",
                attributes: ["id", "username", "email", "role"],
              },
            ],
          });

          io.to(chatId).emit("receiveMessage", messageWithUser);
          
          const receiverSocket = activeUser.find(user => user.userId === receiverId);
          if (receiverSocket && !socket.rooms.has(chatId)) {
            io.to(receiverSocket.socketId).emit("newMessageNotification", {
              chatId,
              message: messageWithUser,
              sender: socket.data?.username
            });
          }

          console.log(`Message sent in chat ${chatId}:`, messageWithUser);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", "Failed to send message");
        }
      });

      socket.on("typing", ({ chatId, userId }) => {
        socket.to(chatId).emit("typing", { chatId, userId });
      });

      socket.on("stopTyping", ({ chatId, userId }) => {
        socket.to(chatId).emit("stopTyping", { chatId, userId });
      });

      socket.on("markAsRead", async ({ chatId }) => {
        const userId = socket.data?.userId;
        if (userId && chatId) {
          await Message.update(
            { read: true },
            { where: { chatId, receiverId: userId, read: false } }
          );
          socket.to(chatId).emit("messagesRead", { chatId, userId });
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        activeUser = activeUser.filter((user) => user.socketId !== socket.id);
      });
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// For production deployment
startServer();

// Export for serverless deployment
export default startServer;
