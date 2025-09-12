
import express, { Router } from "express";
import errorHandler from "../services/errorHandler.js";
import chatController from "../controllers/chatController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireCustomer, requireAdmin } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/multer.js";

    const router: Router = express.Router();

    // POST: Create or get an existing chat - customers only
    router.post("/get-or-create", requireCustomer, errorHandler(chatController.getOrCreateChat));

    // GET: Fetch all messages in a chat - customers only
    router.get("/:chatId/messages", requireCustomer, errorHandler(chatController.getChatMessages));

    // GET: Fetch all messages in a chat - admin only
    router.get("/admin/:chatId/messages", requireAdmin, errorHandler(chatController.getChatMessages));

    // POST: Send a message (with photo upload support) - customers only
    router.post("/send-message", requireCustomer, upload.single('image'), errorHandler(chatController.sendMessage));

    // POST: Send a message (with photo upload support) - admin only
    router.post("/admin/send-message", requireAdmin, upload.single('image'), errorHandler(chatController.sendMessage));

    // GET: Get all chats for current user - customers only
    router.get("/all", requireCustomer, errorHandler(chatController.getAllChats));

    // GET: Get all chats for admin - admin only
    router.get("/admin/all", requireAdmin, errorHandler(chatController.getAllChats));

    // GET: Get unread message count - customers only
    router.get("/unread/count", requireCustomer, errorHandler(chatController.getUnreadCount));

    // GET: Get all admin users (for customer to choose from) - customers only
    router.get("/admins", requireCustomer, errorHandler(chatController.getAdminUsers));

    // GET: Get chat statistics (admin only)
    router.get("/stats", requireAdmin, errorHandler(chatController.getChatStats));

    // POST: Mark messages as read - customers only
    router.post("/:chatId/mark-read", requireCustomer, errorHandler(chatController.markMessageAsRead));

    export default router;