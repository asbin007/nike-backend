
    import express, { Router } from "express";
    import errorHandler from "../services/errorHandler";
    import chatController from "../controllers/chatController";
    import userMiddleware from "../middleware/userMiddleware";
    import { upload } from "../middleware/multer";

    const router: Router = express.Router();

    // POST: Create or get an existing chat
    router.post("/get-or-create",userMiddleware.isUserLoggedIn, errorHandler(chatController.getOrCreateChat));

    // GET: Fetch all messages in a chat
    router.get("/:chatId/messages", userMiddleware.isUserLoggedIn,errorHandler(chatController.getChatMessages));

    // POST: Send a message (with photo upload support)
    router.post("/send-message", userMiddleware.isUserLoggedIn, upload.single('image'), errorHandler(chatController.sendMessage));

    // GET: Get all chats for current user
    router.get("/all", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAllChats));

    // GET: Get unread message count
    router.get("/unread/count", userMiddleware.isUserLoggedIn, errorHandler(chatController.getUnreadCount));

    // GET: Get all admin users (for customer to choose from)
    router.get("/admins", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAdminUsers));

    // GET: Get chat statistics (admin only)
    router.get("/stats", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatStats));

    // POST: Mark messages as read
    router.post("/:chatId/mark-read", userMiddleware.isUserLoggedIn, errorHandler(chatController.markMessageAsRead));

    export default router;