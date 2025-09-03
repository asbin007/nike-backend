import express, { Router } from "express";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../services/errorHandler.js";
import recommendationController from "../controllers/recommendationController.js";

const router: Router = express.Router();

router
  .route("/")
  .get(
    userMiddleware.isUserLoggedIn,
    errorHandler(recommendationController.getRecommendations)
  );

export default router;


