import express, { Router } from "express";
import errorHandler from "../services/errorHandler.js";
import userMiddleware from "../middleware/userMiddleware.js";
import productReviewController from "../controllers/productReviewController.js";

const router: Router = express.Router();

// POST review and GET reviews by product ID
router
  .route('/')
  .post(userMiddleware.isUserLoggedIn, errorHandler(productReviewController.postReview))

  router.route('/:productId').get(errorHandler(productReviewController.getReviewByProductId))

// GET all reviews
router.route('/').get(errorHandler(productReviewController.getAllReviews));

// DELETE and PATCH review by ID (user must be logged in)
router
  .route('/:id')
  .delete(userMiddleware.isUserLoggedIn, errorHandler(productReviewController.deleteReview))
  .patch(userMiddleware.isUserLoggedIn, errorHandler(productReviewController.updateReview));

export default router;
