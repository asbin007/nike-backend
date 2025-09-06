import express, { Router } from "express";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../services/errorHandler.js";
import recommendationController from "../controllers/recommendationController.js";

const router: Router = express.Router();

// Personal recommendations (requires login)
router.get(
  "/",
  userMiddleware.isUserLoggedIn,
  errorHandler(recommendationController.getRecommendations)
);

// Public collections (no login required)
router.get(
  "/trending",
  errorHandler(recommendationController.getTrendingProducts)
);

router.get(
  "/new-arrivals",
  errorHandler(recommendationController.getNewArrivals)
);

router.get(
  "/best-sellers",
  errorHandler(recommendationController.getBestSellers)
);

router.get(
  "/on-sale",
  errorHandler(recommendationController.getOnSaleProducts)
);

// Get all collections at once
router.get(
  "/collections",
  errorHandler(recommendationController.getAllCollections)
);

export default router;
