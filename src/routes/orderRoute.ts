import express,{ Router } from "express";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import errorHandler from "../services/errorHandler.js";
import orderController from "../controllers/orderController.js";


const router:Router= express.Router()

router.route("/").post(userMiddleware.isUserLoggedIn, errorHandler(orderController.createOrder)).get(userMiddleware.isUserLoggedIn,errorHandler(orderController.fetchMyOrder))
router.route("/all").get( errorHandler(orderController.fetchAllOrders))

// Khalti Payment Verification
router.route("/khalti/verify").post(userMiddleware.isUserLoggedIn, errorHandler(orderController.verifyTransaction))

// Khalti Webhook (no authentication required as this is called by Khalti)
router.route("/khalti-webhook").post(errorHandler(orderController.khaltiWebhook))

router.route('/:id').get(errorHandler(orderController.fetchMyOrderDetail  ))
router.route("/admin/change-status/:id").patch(userMiddleware.isUserLoggedIn,userMiddleware.accessTo(Role.Admin), errorHandler(orderController.changeOrderStatus))
router.route("/admin/change-payment-status").patch(userMiddleware.isUserLoggedIn,userMiddleware.accessTo(Role.Admin), errorHandler(orderController.changePaymentStatus))
router.route("/admin/delete-order/:id").post(userMiddleware.isUserLoggedIn,userMiddleware.accessTo(Role.Admin), errorHandler(orderController.deleteOrder))
router.route("/cancel-order/:id").patch(userMiddleware.isUserLoggedIn,userMiddleware.accessTo(Role.Customer), errorHandler(orderController.cancelOrder))

export default router