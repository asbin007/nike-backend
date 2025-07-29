import express, { Router } from "express";
import productController from "../controllers/productController";
import userMiddleware, { Role } from "../middleware/userMiddleware";
import errorHandler from "../services/errorHandler";
import { upload } from '../middleware/multer';

// import multer from "multer";
const router: Router = express.Router();

router
  .route("/")
  .post(upload.array("images",5), errorHandler(productController.createProduct))
  .get(productController.getAllProducts);

router
  .route("/:id")
  .delete(
    userMiddleware.isUserLoggedIn,
    userMiddleware.accessTo(Role.Admin),
    errorHandler(productController.deleteProduct)
)
  .get(errorHandler(productController.getSingleProduct)).patch(upload.array("images",5), errorHandler(productController.updateProduct));

export default router;
