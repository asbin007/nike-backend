    import express,{ Router } from "express";
    import userMiddleware, { Role } from "../middleware/userMiddleware.js";
    import { requireCustomer, requireAdmin } from "../middleware/roleMiddleware.js";
    import errorHandler from "../services/errorHandler.js";
    import orderController from "../controllers/orderController.js";


    const router:Router= express.Router()

    // Public route for fetching all orders (used by admin panel) - MUST be before /:id
    router.route("/all").get( errorHandler(orderController.fetchAllOrders))

    // Khalti Payment Verification - customers only
    router.route("/khalti/verify").post(requireCustomer, errorHandler(orderController.verifyTransaction))

    // Khalti Webhook (no authentication is required as this is called by Khalti)
    router.route("/khalti-webhook").post(errorHandler(orderController.khaltiWebhook))

    // Customer order operations
    router.route("/").post(requireCustomer, errorHandler(orderController.createOrder)).get(requireCustomer, errorHandler(orderController.fetchMyOrder))

    // Order details - customers only
    router.route('/:id').get(requireCustomer, errorHandler(orderController.fetchMyOrderDetail))
    
    // Admin-only operations
    router.route("/admin/:id").get(requireAdmin, errorHandler(orderController.fetchMyOrderDetail))
    router.route("/admin/change-status/:id").patch(requireAdmin, errorHandler(orderController.changeOrderStatus))
    router.route("/admin/change-payment-status/:id").patch(requireAdmin, errorHandler(orderController.changePaymentStatus))
    router.route("/admin/delete-order/:id").delete(requireAdmin, errorHandler(orderController.deleteOrder))
    router.route("/admin/bulk-delete-orders").delete(requireAdmin, errorHandler(orderController.bulkDeleteOrders))
    
    // Customer order cancellation
    router.route("/cancel-order/:id").patch(requireCustomer, errorHandler(orderController.cancelOrder))

    export default router

    