import jwt from "jsonwebtoken";
import adminSeeder from "./src/adminSeeder.ts";
import superAdminSeeder from "./src/superAdminSeeder.ts";
import app from "./src/app.ts";
import { envConfig } from "./src/config/config.ts";
import categoryController from "./src/controllers/categoryController.ts";
import collectionController from "./src/controllers/collectionController.ts";

import { Server, Socket } from "socket.io";
import User from "./src/database/models/userModel.ts";
import Order from "./src/database/models/orderModel.ts";
import Payment from "./src/database/models/paymentModel.ts";
import Message from "./src/database/models/messageModel.ts";
import Chat from "./src/database/models/chatModel.ts";
import sequelize from "./src/database/connection.ts";

function startServer() {
  try {
    const server = app.listen(envConfig.port, async () => {
      console.log(`Server is running on port ${envConfig.port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Wait for database sync to complete before running seeders
      if (envConfig.databaseUrl) {
        try {
          // Wait for database sync
          await sequelize.sync({ force: false, alter: true });
          console.log("Database synced successfully");
          
          // Now run seeders
          await categoryController.seedCategory();
          await superAdminSeeder(); // Run super admin seeder first
          await adminSeeder();
          await collectionController.seedCollection();
          console.log("All seeders completed successfully");
        } catch (error) {
          console.error('Error running seeders:', error);
        }
      } else {
        console.log('Skipping seeders - no database connection');
      }
    });

  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://nike-frontend.vercel.app",
        "https://nike-store-frontend.vercel.app",
        "https://nike-store-frontend.vercel.app", // Add your actual frontend URL
        "https://nike-frontend.vercel.app", // Add your actual frontend URL
        "*" // Temporary for testing - remove this later
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
    console.log("connected");
    const { token } = socket.handshake.auth;
    console.log(token, "token");
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
          console.log(socket.id, result.userId, userData.role);
          addToOnlineUsers(socket.id, result.userId, userData.role);
            
            // Store user data in socket for later use
            socket.data = {
              userId: result.userId,
              role: userData.role,
              username: userData.username
            };
            
          console.log(activeUser);
        }
      );
    } else {
      console.log("triggered");
      socket.emit("error", "Please provide token");
    }
    console.log(activeUser);
    socket.on("updateOrderStatus", async (data) => {
      const { status, orderId, userId } = data;
      console.log(data, "USS");
      console.log(status, orderId);
      const findUser = activeUser.find((user) => user.userId == userId); // {socketId,userId, role}
      await Order.update(
        {
          orderStatus: status,
        },
        {
          where: {
            id: orderId,
          },
        }
      );
      if (findUser) {
        console.log(findUser.socketId, "FS");
        io.to(findUser.socketId).emit("statusUpdated", data);
      } else {
        socket.emit("error", "User is not online!!");
      }
    });

    socket.on("updatePaymentStatus", async (data) => {
      const { status, paymentId, userId } = data;
      console.log(data, "payments");

      const findUser = activeUser.find((user) => user.userId == userId);
      await Payment.update(
        {
          paymentStatus: status,
        },
        {
          where: { id: paymentId },
        }
      );
      if (findUser) {
        console.log(findUser.socketId, "Sending Payment Update");
        io.to(findUser.socketId).emit("paymentStatusUpdated", {
          paymentId,
          status,
          message: "Payment status updated successfully",
        });
      } else {
        socket.emit("error", "User is not online to receive payment update!");
      }
    });

    // handle for chat
    socket.on("joinChat", (chatId: string) => {
      console.log(`User joined chat: ${chatId}`);
      socket.join(chatId);
    });

      socket.on("leaveChat", (chatId: string) => {
        console.log(`User left chat: ${chatId}`);
        socket.leave(chatId);
      });

    socket.on("sendMessage", async (data) => {
      const { chatId, content, imageUrl } = data;
      const senderId = socket.data?.userId;
      
      if (!chatId || (!content && !imageUrl) || !senderId) {
        socket.emit(
          "error",
          "Chat ID, content or image, and sender ID are required"
        );
        return;
      }

        try {
          // Verify chat exists and user has access
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

          // Update chat's updatedAt timestamp
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

      // send to all clients in the chat room
          io.to(chatId).emit("receiveMessage", messageWithUser);
          
          // Send notification to receiver if they're not in the chat room
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
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// For production deployment (Render/Vercel)
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export for serverless deployment
export default startServer;
