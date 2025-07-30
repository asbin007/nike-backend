import express from "express";
import UserController from "../controllers/userController";
import userMiddleware, { Role } from "../middleware/userMiddleware";
import errorHandler from "../services/errorHandler";
const router = express.Router();

router.route("/register").post(UserController.register);
router.route("/verify-otp").post(UserController.verifyOtp);
router.route("/resend-otp").post(UserController.resendOtp);
router.route("/login").post(UserController.login);
router.route("/forgot-password").post(UserController.forgotPassword);
router.route("/reset-password").post(UserController.resetPassword);
router.route("/users").get(errorHandler(UserController.fetchUsers));
router
  .route("/users/:id")
  .delete(
    
    errorHandler(UserController.deleteUser)
  );
router.route("/logins").post(UserController.adminLogin);

export default router;
