import express from "express";
import UserController from "../controllers/userController.js";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import errorHandler from "../services/errorHandler.js";
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
    userMiddleware.isUserLoggedIn,
    userMiddleware.accessTo(Role.Admin),
    errorHandler(UserController.deleteUser)
  );
router.route("/logins").post(UserController.adminLogin);
router.route("/admin/register").post(UserController.registerAdmin);
router.route("/super-admin/register").post(UserController.registerSuperAdmin);
router.route("/super-admin/login").post(UserController.superAdminLogin);

// Admin Management Routes (Super Admin Only)
router.route("/admin-management/admins").get(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.getAllAdmins)
);

router.route("/admin-management/stats").get(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.getAdminStats)
);

router.route("/admin-management/admins/:id").get(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.getAdminById)
);

router.route("/admin-management/admins/:id").put(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.updateAdmin)
);

router.route("/admin-management/promote").post(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.promoteToAdmin)
);

router.route("/admin-management/admins/:adminId/demote").put(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.demoteToCustomer)
);

router.route("/admin-management/admins/:adminId").delete(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.deleteAdmin)
);

router.route("/admin-management/bulk").post(
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.SuperAdmin),
  errorHandler(UserController.bulkUpdateAdmins)
);

export default router;
