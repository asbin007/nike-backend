import express,{ Router } from "express";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import errorHandler from "../services/errorHandler.js";
import cartController from "../controllers/cartController.js";


const router:Router= express.Router()
router.route('/').post(userMiddleware.isUserLoggedIn,errorHandler(cartController.addToCart)).get(userMiddleware.isUserLoggedIn,errorHandler(cartController.getCart))
router.route('/:productId').patch(userMiddleware.isUserLoggedIn,errorHandler(cartController.updateCart)).delete(userMiddleware.isUserLoggedIn,errorHandler(cartController.removeFromCart))



export default router