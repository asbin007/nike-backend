import express from "express";
import SuperAdminController from "../controllers/superAdminController";
import userMiddleware, { Role } from "../middleware/userMiddleware";
import errorHandler from "../services/errorHandler";

const router = express.Router();

// login route - no auth needed
router.route("/login").post(SuperAdminController.superAdminLogin);

// all other routes need super admin auth
router.use(userMiddleware.isUserLoggedIn);
router.use(userMiddleware.accessTo(Role.SuperAdmin));

// admin management routes
router.route("/admins")
  .get(SuperAdminController.getAllAdmins)
  .post(SuperAdminController.createAdmin);

router.route("/admins/:id")
  .get(SuperAdminController.getAdminById)
  .put(SuperAdminController.updateAdmin)
  .delete(SuperAdminController.deleteAdmin);

// password reset route
router.route("/admins/:id/reset-password")
  .put(SuperAdminController.resetAdminPassword);

// resend verification routes
router.route("/admins/:id/resend-verification")
  .post(SuperAdminController.resendVerificationEmail);

router.route("/resend-verification")
  .post(SuperAdminController.resendVerificationEmail);

// verify admin route (skip OTP verification)
router.route("/admins/:id/verify")
  .put(SuperAdminController.verifyAdmin);

// system stats route
router.route("/stats")
  .get(SuperAdminController.getSystemStats);

// handle errors
router.use(errorHandler as any);

export default router; 