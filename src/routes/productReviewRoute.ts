import express, { Router } from "express";
import errorHandler from "../services/errorHandler.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireCustomer } from "../middleware/roleMiddleware.js";
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

// DELETE and PATCH review by ID - customers only
router
  .route('/:id')
  .delete(requireCustomer, errorHandler(productReviewController.deleteReview))
  .patch(requireCustomer, errorHandler(productReviewController.updateReview));

export default router;
