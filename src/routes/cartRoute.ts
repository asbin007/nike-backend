import express,{ Router } from "express";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import { requireCustomer } from "../middleware/roleMiddleware.js";
import errorHandler from "../services/errorHandler.js";
import cartController from "../controllers/cartController.js";


const router:Router= express.Router()
// Cart operations should only be available to customers
router.route('/').post(requireCustomer, errorHandler(cartController.addToCart)).get(requireCustomer, errorHandler(cartController.getCart))
router.route('/:productId').patch(requireCustomer, errorHandler(cartController.updateCart)).delete(requireCustomer, errorHandler(cartController.removeFromCart))



export default router