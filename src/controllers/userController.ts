import { Role } from './../middleware/userMiddleware.js';
import otpGenerator from "otp-generator";
import { envConfig } from "./../config/config.js";
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response } from "express";
import User from "../database/models/userModel.js";
import bcrypt from "bcrypt";
import sendMail from "../services/sendMail.js";
import checkOtpExpiration from "../services/optExpiration.js";
import Cart from "../database/models/cartModel.js";
import Order from "../database/models/orderModel.js";
import Chat from "../database/models/chatModel.js";
import Message from "../database/models/messageModel.js";
import { Op } from "sequelize";

class UserController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      // basic validation
      if (!username || !email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      // check password length
      if (password.length < 6) {
        res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      // see if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User already exists",
        });
        return;
      }

      // generate a 6 digit otp
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      // hash the password and create user
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        otp,
        otpGeneratedTime: Date.now().toString(),
        isVerified: false,
      });

      // Send OTP email
      try {
        await sendMail({
          to: email,
          subject: "Registration OTP - ShowMart",
          text: `Your registration OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to SHOEMART! 🏃‍♂️</h2>
              <p>Hi ${username},</p>
              <p>Thank you for registering with Nike Store. Please complete your registration using the OTP below:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you didn't create this account, please ignore this email.</p>
              <p>Best regards,<br>Nike Store Team</p>
            </div>
          `
        });

        res.status(201).json({
          message: "User registered successfully. Please check your email for OTP.",
          userId: newUser.id,
          email: newUser.email,
          requiresOtp: true,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Delete the user if email sending fails
        await newUser.destroy();
        res.status(500).json({
          message: "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error,
      });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        res.status(400).json({
          message: "Email and OTP are required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (user.otp !== otp) {
        res.status(400).json({
          message: "Invalid OTP",
        });
        return;
      }

      // Check if OTP is expired (10 minutes)
      if (!checkOtpExpiration(user.otpGeneratedTime, 600000)) {
        res.status(403).json({
          message: "OTP expired. Please request a new one.",
        });
        return;
      }

      // Mark user as verified and clear OTP after successful verification
      user.isVerified = true;
      user.otp = "";
      user.otpGeneratedTime = "";
      await user.save();

      res.status(200).json({
        message: "OTP verified successfully! You can now login.",
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          message: "Email is required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      // Generate new OTP
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      // Update user with new OTP
      user.otp = otp;
      user.otpGeneratedTime = Date.now().toString();
      await user.save();

      // Send new OTP email
      try {
        await sendMail({
          to: email,
          subject: "Registration OTP - Nike Store",
          text: `Your new registration OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Registration OTP - Nike Store</h2>
              <p>Hi ${user.username},</p>
              <p>Here's your new registration OTP:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>Best regards,<br>Nike Store Team</p>
            </div>
          `
        });

        res.status(200).json({
          message: "New OTP sent to your email",
          email: user.email,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(500).json({
          message: "Failed to send OTP. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "User not found",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          message: "Invalid password",
        });
        return;
      }



     
        // Check if user is verified (OTP verification required)
        if (!user.isVerified) {
          res.status(403).json({
            message: "Please verify your email with OTP before logging in. Check your email for verification code.",
            requiresOtp: true,
            email: user.email
          });
          return;
        }

         const token = jwt.sign(
        { 
          userId: user.id,
          role: user.role
        },
        envConfig.jwtSecret as Secret,
        {
          expiresIn: "30d",
        }
      );

      res.status(201).json({
        message: "User logged in successfully",
        id: user.id, 
        username: user.username,
        email: user.email,
        role: user.role,
        token: token,
      
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({
          message: "Email is required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "Email not found",
        });
        return;
      }

      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      await sendMail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is ${otp}`,
      });

      user.otp = otp;
      user.otpGeneratedTime = Date.now().toString();
      await user.save();

      res.status(201).json({
        message: "OTP sent to your email",
        otp,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

static async resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      res.status(400).json({
        message: "Fill all the fields",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        message: "Password and confirm password do not match",
      });
      return;
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }
    if (user.otp !== otp) {
      res.status(400).json({
        message: "Invalid OTP",
      });
      return;
    }
    if (!checkOtpExpiration(user.otpGeneratedTime, 120000)) {
      res.status(403).json({
        message: "OTP expired, Sorry try again later 😭!!",
      });
      return;
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.status(201).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

  static async fetchUsers(req: Request, res: Response) {
    const user = await User.findAll({
      where:{
        role:Role.Customer
      },
      attributes: ["id", "username", "email", "role"],
    });

    res.status(201).json({
      message: "User fetched successfully",
      data: user,
    });
  }

  // Fix for deleteUser function in UserController.js
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          message: "Please provide Id",
        });
        return;
      }
      
      // Find the user to check their role
      const userToDelete = await User.findOne({ where: { id } });

      if (!userToDelete) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Prevent deleting users with Admin role
      if (userToDelete.role === Role.Admin) {
        res.status(403).json({ message: "Admins cannot be deleted" });
        return;
      }

      // Delete related chats first to avoid foreign key constraint
      try {
        const Chat = require('../database/models/chatModel.js').default;
        await Chat.destroy({
          where: { customerId: id }
        });
        console.log(`Deleted chats for user ${id}`);
       } catch (chatError: any) {
         console.log('No chats to delete or chat deletion failed:', chatError.message);
       }

      // Delete any other related data (orders, reviews, etc.)
      try {
        const Order = require('../database/models/orderModel.js').default;
        await Order.destroy({
          where: { userId: id }
        });
        console.log(`Deleted orders for user ${id}`);
       } catch (orderError: any) {
         console.log('No orders to delete or order deletion failed:', orderError.message);
       }

      // Now delete the user
      await User.destroy({
        where: { id },
      });

      res.status(200).json({
        message: "User deleted successfully",
        deletedUserId: id,
      });
      
    } catch (error: any) {
      console.error('Delete user error:', error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        res.status(400).json({ 
          message: "Cannot delete user because they have related data (chats, orders, etc.)" 
        });
      } else if (error.name === 'SequelizeValidationError') {
        res.status(400).json({ 
          message: "Validation error: " + error.message 
        });
      } else {
        res.status(500).json({
          message: "Internal server error while deleting user",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  }
  // login for user for admin panel

static async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password,role } = req.body;
      if (!email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "User not found",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          message: "Invalid password",
        });
        return;
      }
      if(user.role!==Role.Admin){
          res.status(403).json({ message: "Access denied. Admins only." });
      return;

      }

      const token = jwt.sign(
        { 
          userId: user.id,
          role: user.role
        },
        envConfig.jwtSecret as Secret,
        {
          expiresIn: "30d",
        }
      );

      res.status(201).json({
        message: "Admin logged in successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  static async registerAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      // basic validation
      if (!username || !email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      // check password length
      if (password.length < 6) {
        res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      // see if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User already exists",
        });
        return;
      }

      // hash the password and create admin user directly (no OTP verification needed)
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newAdmin = await User.create({
        username,
        email,
        password: hashedPassword,
        role: Role.Admin, // Set role as admin
        isVerified: true, // Admin is verified immediately
      });

      res.status(201).json({
        message: "Admin registered successfully. You can now login.",
        userId: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error,
      });
    }
  }

  // Super Admin Registration
  static async registerSuperAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          message: "Username, email, and password are required",
        });
        return;
      }

      // Check if super admin already exists
      const existingSuperAdmin = await User.findOne({
        where: { 
          email: email,
          role: 'super_admin'
        }
      });

      if (existingSuperAdmin) {
        res.status(400).json({
          message: "Super admin with this email already exists",
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create super admin
      const superAdmin = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'super_admin',
        isVerified: true
      });

      res.status(201).json({
        message: "Super admin registered successfully",
        userId: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
      });
    } catch (error) {
      console.error("Super admin registration error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error,
      });
    }
  }

  // Super Admin Login
  static async superAdminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      // Find super admin user (also allow admin with super@gmail.com to login as super admin)
      const superAdmin = await User.findOne({
        where: email === 'super@gmail.com' 
          ? { email: email, role: ['admin', 'super_admin'] }
          : { email: email, role: 'super_admin' }
      });

      if (!superAdmin) {
        res.status(401).json({
          message: "Super admin not found",
        });
        return;
      }

      // Check if super admin is verified
      if (!superAdmin.isVerified) {
        res.status(401).json({
          message: "Super admin account not verified",
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
      if (!isPasswordValid) {
        res.status(401).json({
          message: "Invalid credentials",
        });
        return;
      }

      // Generate JWT token with role
      const token = jwt.sign(
        { 
          userId: superAdmin.id,
          role: 'super_admin'
        },
        envConfig.jwtSecret as Secret,
        {
          expiresIn: "30d",
        }
      );

      res.status(200).json({
        message: "Super admin login successful",
        token: token,
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          email: superAdmin.email,
          role: 'super_admin', // Always return super_admin role for super admin login
          isVerified: superAdmin.isVerified,
        },
      });
    } catch (error) {
      console.error("Super admin login error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error,
      });
    }
  }

  // Admin Management Functions (Super Admin Only)
  
  // Get all admins with pagination and search
  static async getAllAdmins(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where clause
      let whereClause: any = {
        role: 'admin'
      };

      // Add search functionality
      if (search) {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ]
        };
      }

      // Add status filter
      if (status === 'active') {
        whereClause.isVerified = true;
      } else if (status === 'inactive') {
        whereClause.isVerified = false;
      }

      const { count, rows: admins } = await User.findAndCountAll({
        where: whereClause,
        attributes: [
          'id', 
          'username', 
          'email', 
          'role', 
          'isVerified', 
          'createdAt', 
          'updatedAt'
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.status(200).json({
        success: true,
        message: "Admins fetched successfully",
        data: {
          admins,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalAdmins: count,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1
          }
        }
      });
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Get single admin by ID
  static async getAdminById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const admin = await User.findOne({
        where: { 
          id: id,
          role: 'admin'
        },
        attributes: [
          'id', 
          'username', 
          'email', 
          'role', 
          'isVerified', 
          'createdAt', 
          'updatedAt'
        ]
      });

      if (!admin) {
        res.status(404).json({
          success: false,
          message: "Admin not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Admin fetched successfully",
        data: admin
      });
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Update admin
  static async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, isVerified, password } = req.body;

      const admin = await User.findOne({
        where: { 
          id: id,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          success: false,
          message: "Admin not found"
        });
        return;
      }

      // Check if email is being changed and if it already exists
      if (email && email !== admin.email) {
        const existingAdmin = await User.findOne({
          where: { 
            email: email,
            role: 'admin',
            id: { [Op.ne]: id }
          }
        });

        if (existingAdmin) {
          res.status(400).json({
            success: false,
            message: "Admin with this email already exists"
          });
          return;
        }
      }

      // Update fields
      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await admin.update(updateData);

      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          isVerified: admin.isVerified,
          updatedAt: admin.updatedAt
        }
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Promote customer to admin
  static async promoteToAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required"
        });
        return;
      }

      const user = await User.findOne({
        where: { 
          id: userId,
          role: 'customer'
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Customer not found"
        });
        return;
      }

      // Update user role to admin
      await user.update({
        role: 'admin',
        isVerified: true
      });

      res.status(200).json({
        success: true,
        message: "Customer promoted to admin successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Demote admin to customer
  static async demoteToCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { adminId } = req.params;

      const admin = await User.findOne({
        where: { 
          id: adminId,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          success: false,
          message: "Admin not found"
        });
        return;
      }

      // Update admin role to customer
      await admin.update({
        role: 'customer',
        isVerified: false
      });

      res.status(200).json({
        success: true,
        message: "Admin demoted to customer successfully",
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          isVerified: admin.isVerified
        }
      });
    } catch (error) {
      console.error("Error demoting admin to customer:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Delete admin (soft delete - demote to customer)
  static async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { adminId } = req.params;

      const admin = await User.findOne({
        where: { 
          id: adminId,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          success: false,
          message: "Admin not found"
        });
        return;
      }

      // Soft delete - change role to customer instead of hard delete
      await admin.update({
        role: 'customer',
        isVerified: false
      });

      res.status(200).json({
        success: true,
        message: "Admin deleted successfully",
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Get admin statistics
  static async getAdminStats(req: Request, res: Response): Promise<void> {
    try {
      const totalAdmins = await User.count({
        where: { role: 'admin' }
      });

      const activeAdmins = await User.count({
        where: { 
          role: 'admin',
          isVerified: true
        }
      });

      const inactiveAdmins = await User.count({
        where: { 
          role: 'admin',
          isVerified: false
        }
      });

      const totalCustomers = await User.count({
        where: { role: 'customer' }
      });

      res.status(200).json({
        success: true,
        message: "Admin statistics fetched successfully",
        data: {
          totalAdmins,
          activeAdmins,
          inactiveAdmins,
          totalCustomers,
          adminToCustomerRatio: totalCustomers > 0 ? (totalAdmins / totalCustomers).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Bulk operations
  static async bulkUpdateAdmins(req: Request, res: Response): Promise<void> {
    try {
      const { adminIds, action, data } = req.body;

      if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Admin IDs array is required"
        });
        return;
      }

      if (!action) {
        res.status(400).json({
          success: false,
          message: "Action is required"
        });
        return;
      }

      let updateData: any = {};
      let message = "";

      switch (action) {
        case 'activate':
          updateData = { isVerified: true };
          message = "Admins activated successfully";
          break;
        case 'deactivate':
          updateData = { isVerified: false };
          message = "Admins deactivated successfully";
          break;
        case 'demote':
          updateData = { role: 'customer', isVerified: false };
          message = "Admins demoted to customers successfully";
          break;
        default:
          res.status(400).json({
            success: false,
            message: "Invalid action"
          });
          return;
      }

      const [affectedCount] = await User.update(updateData, {
        where: {
          id: { [Op.in]: adminIds },
          role: 'admin'
        }
      });

      res.status(200).json({
        success: true,
        message,
        data: {
          affectedCount,
          adminIds
        }
      });
    } catch (error) {
      console.error("Error in bulk update:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

}


export default UserController;

