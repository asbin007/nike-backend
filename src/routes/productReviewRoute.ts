import express, { Router } from "express";
import errorHandler from "../services/errorHandler.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireCustomer, requireRole, Role } from "../middleware/roleMiddleware.js";
import productReviewController from "../controllers/productReviewController.js";

const router: Router = express.Router();

// POST review - customers only
router
  .route('/')
  .post(requireCustomer, errorHandler(productReviewController.postReview))

// GET reviews by product ID - public
router.route('/:productId').get(errorHandler(productReviewController.getReviewByProductId))

// GET all reviews - public
router.route('/').get(errorHandler(productReviewController.getAllReviews));

// DELETE and PATCH review by ID - authenticated users (ownership checked in controller)
router
  .route('/:id')
  .delete(requireRole([Role.Customer, Role.Admin, Role.SuperAdmin]), errorHandler(productReviewController.deleteReview))
  .patch(requireRole([Role.Customer, Role.Admin, Role.SuperAdmin]), errorHandler(productReviewController.updateReview));

export default router;