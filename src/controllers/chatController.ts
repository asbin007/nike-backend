import { Request, Response } from "express";
import Chat from "../database/models/chatModel.js";
import User from "../database/models/userModel.js";
import Message from "../database/models/messageModel.js";
import { upload } from "../middleware/multer.js";


class ChatController {
  //create or get chat between  user and admin
  async getOrCreateChat(req: Request, res: Response) {
    const { adminId } = req.body;
    const customerId = req.user?.id;
    
    if (!adminId || !customerId) {
      res.status(400).json({
        message: "Admin ID and Customer ID are required",
      });
      return;
    }

    // Check if admin exists or not 
    const admin = await User.findOne({ where: { id: adminId, role: 'admin' } });
    if (!admin) {
      res.status(404).json({
        message: "Admin not found",
      });
      return;
    }

    let chat = await Chat.findOne({
      where: {
        adminId,
        customerId,
      },
    });
    if (!chat) {
      chat = await Chat.create({
        customerId,
        adminId,
      });
    }
    res.status(200).json({
      message: "Chat retrieved successfully",
      chat,
    });
  }

  // get all messages in a chat
  async getChatMessages(req: Request, res: Response) {
    try {
      console.log("🔍 getChatMessages - Request received");
      console.log("🔍 getChatMessages - Params:", req.params);
      console.log("🔍 getChatMessages - User:", req.user);
      
      const { chatId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!chatId) {
        console.log("❌ getChatMessages - No chatId provided");
        res.status(400).json({
          message: "Chat ID is required",
        });
        return;
      }

      console.log("🔍 getChatMessages - Looking for chat with ID:", chatId);

      // For admin, allow access to any chat; for customer, only their chats
      let chat;
      if (userRole === 'admin') {
        chat = await Chat.findOne({
          where: { id: chatId }
        });
      } else {
        chat = await Chat.findOne({
          where: { 
            id: chatId,
            customerId: userId 
          }
        });
      }

      if (!chat) {
        console.log("❌ getChatMessages - Chat not found or access denied");
        res.status(403).json({
          message: "Access denied to this chat",
        });
        return;
      }

      console.log("✅ getChatMessages - Chat found:", chat.id);

      const messages = await Message.findAll({
        where: { chatId },
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
        order: [["createdAt", "ASC"]],
      });

      console.log("✅ getChatMessages - Found messages:", messages.length);

      // Mark messages as read for the current user
      await Message.update(
        { read: true },
        { where: { chatId, receiverId: userId, read: false } }
      );

      console.log("✅ getChatMessages - Messages marked as read");

      res.status(200).json({
        message: "Messages retrieved successfully",
        data: messages,
      });
    } catch (error) {
      console.error("❌ getChatMessages - Error:", error);
      res.status(500).json({
        message: "Internal server error while fetching messages",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // send message in a chat
  async sendMessage(req: Request, res: Response) {
    try {
      console.log("🔍 sendMessage - Request received");
      console.log("🔍 sendMessage - Body:", req.body);
      console.log("🔍 sendMessage - User:", req.user);
      
      const { chatId, content } = req.body;
      const senderId = req.user?.id;
      const userRole = req.user?.role;
      const imageUrl = (req as any).file?.path; // Get uploaded image URL
      
      if (!chatId || (!content && !imageUrl) || !senderId) {
        console.log("❌ sendMessage - Missing required fields");
        res.status(400).json({
          message: "Chat ID, content or image, and sender ID are required",
        });
        return;
      }

      console.log("🔍 sendMessage - Looking for chat with ID:", chatId);

      // For admin, allow access to any chat; for customer, only their chats
      let chat;
      if (userRole === 'admin') {
        chat = await Chat.findOne({
          where: { id: chatId }
        });
      } else {
        chat = await Chat.findOne({
          where: { 
            id: chatId,
            customerId: senderId 
          }
        });
      }

      if (!chat) {
        console.log("❌ sendMessage - Chat not found or access denied");
        res.status(403).json({
          message: "Access denied to this chat",
        });
        return;
      }

      console.log("✅ sendMessage - Chat found:", chat.id);

      const receiverId = userRole === 'admin' ? chat.customerId : chat.adminId;

      console.log("🔍 sendMessage - Creating message with receiverId:", receiverId);

      const message = await Message.create({
        chatId,
        senderId,
        receiverId,
        content: content || "",
        imageUrl: imageUrl || null,
        read: false,
      });

      console.log("✅ sendMessage - Message created with ID:", message.id);

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

      console.log("✅ sendMessage - Message with user data retrieved");

      res.status(200).json({
        message: "Message sent successfully",
        data: messageWithUser,
      });
    } catch (error) {
      console.error("❌ sendMessage - Error:", error);
      res.status(500).json({
        message: "Internal server error while sending message",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // get all chats
  async getAllChats(req: Request, res: Response) {
    console.log("🔍 ChatController.getAllChats - Request received");
    console.log("🔍 ChatController.getAllChats - User data:", req.user);
    
    const { id: userId, role } = req.user || {};
    if (!userId || !role) {
      console.log("❌ ChatController.getAllChats - Missing user ID or role");
      res.status(400).json({
        message: "User ID and role are required",
      });
      return;
    }
    
    console.log("🔍 ChatController.getAllChats - User ID:", userId, "Role:", role);
    
    // For admin, show all chats; for customer, show only their chats
    const where = role === "admin" ? {} : { customerId: userId };
    console.log("🔍 ChatController.getAllChats - Query where clause:", where);
    
    const chats = await Chat.findAll({
      where,
      include: [
        {
          model: User,
          as: role === "admin" ? "Customer" : "Admin",
          attributes: ["id", "username", "email", "role"],
        },
        {
          model: User,
          as: role === "admin" ? "Admin" : "Customer",
          attributes: ["id", "username", "email", "role"],
        },
        {
          model: Message,
          limit: 1,
          order: [["createdAt", "DESC"]],
          attributes: ["content", "createdAt", "read"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    console.log("✅ ChatController.getAllChats - Found chats:", chats.length);
    console.log("✅ ChatController.getAllChats - Returning response");

    res.status(200).json({
      message: "Chats fetched successfully",
      data: chats,
    });
  }

  // Get unread message count for a user
  async getUnreadCount(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    const unreadCount = await Message.count({
      where: { receiverId: userId, read: false },
    });

    res.status(200).json({
      message: "Unread count retrieved successfully",
      data: { unreadCount },
    });
  }

  // Get all admin users for customer to choose from
  async getAdminUsers(req: Request, res: Response) {
    const admins = await User.findAll({
      where: { role: "admin" },
      attributes: ["id", "username", "email"],
    });

    res.status(200).json({
      message: "Admin users retrieved successfully",
      data: admins,
    });
  }

  // Get chat statistics for admin dashboard
  async getChatStats(req: Request, res: Response) {
    const { id: userId, role } = req.user || {};
    if (!userId || role !== "admin") {
      res.status(403).json({
        message: "Admin access required",
      });
      return;
    }

    const totalChats = await Chat.count({ where: { adminId: userId } });
    const unreadMessages = await Message.count({
      where: { receiverId: userId, read: false },
    });
    const totalMessages = await Message.count({
      include: [{
        model: Chat,
        where: { adminId: userId }
      }]
    });

    res.status(200).json({
      message: "Chat statistics retrieved successfully",
      data: {
        totalChats,
        unreadMessages,
        totalMessages,
      },
    });
  }

  //   MARK AS READ
  async markMessageAsRead(req: Request, res: Response) {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "Chat ID is required",
      });
      return;
    }
    await Message.update(
      { read: true },
      { where: { chatId, receiverId: userId, read: false } }
    );

    res.status(200).json({ message: "Messages marked as read." });
  }
}

export default new ChatController();
