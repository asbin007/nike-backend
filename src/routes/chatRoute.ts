import express, { Router } from "express";
import errorHandler from "../services/errorHandler.js";
import chatController from "../controllers/chatController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireCustomer, requireAdmin } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/multer.js";

    const router: Router = express.Router();

    // POST: Create or get an existing chat - customers only
    router.post("/get-or-create", requireCustomer, errorHandler(chatController.getOrCreateChat));

    // GET: Get all admin users (for customer to choose from) - customers only
    router.get("/admins", requireCustomer, errorHandler(chatController.getAdminUsers));

    // GET: Get unread message count - customers only
    router.get("/unread/count", requireCustomer, errorHandler(chatController.getUnreadCount));

    // GET: Get all chats for current user - both customers and admins
    router.get("/all", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAllChats));

    // GET: Get chat statistics (admin only)
    router.get("/stats", requireAdmin, errorHandler(chatController.getChatStats));

    // POST: Send a message (with photo upload support) - both customers and admins
    router.post("/send-message", userMiddleware.isUserLoggedIn, upload.single('image'), errorHandler(chatController.sendMessage));

    // GET: Fetch all messages in a chat - both customers and admins
    router.get("/:chatId/messages", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatMessages));

    // POST: Mark messages as read - both customers and admins
    router.post("/:chatId/mark-read", userMiddleware.isUserLoggedIn, errorHandler(chatController.markMessageAsRead));

    export default router;