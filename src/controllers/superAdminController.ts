import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { envConfig } from "../config/config";
import User from "../database/models/userModel";
import otpGenerator from "otp-generator";
import sendMail from "../services/sendMail";

class SuperAdminController {
  // login for super admin
  static async superAdminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      // check if email and password provided
      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      // find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "Super admin not found",
        });
        return;
      }

      // make sure it's actually a super admin
      if (user.role !== 'super_admin') {
        res.status(403).json({
          message: "Access denied. Super admin only.",
        });
        return;
      }

      // verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          message: "Invalid password",
        });
        return;
      }

      // generate jwt token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        envConfig.jwtSecret as Secret,
        {
          expiresIn: "30d",
        }
      );

      res.status(200).json({
        message: "Super admin logged in successfully",
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

  // Verify Admin (skip OTP verification)
  static async verifyAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email } = req.body;

      // Find the admin by ID
      const admin = await User.findOne({
        where: {
          id,
          role: 'admin',
          isVerified: false
        }
      });

      if (!admin) {
        res.status(404).json({
          message: "Admin not found or already verified",
        });
        return;
      }

      // Update admin to verified status
      admin.isVerified = true;
      admin.otp = ""; // Clear OTP since it's no longer needed
      admin.otpGeneratedTime = "";
      
      await admin.save();

      res.status(200).json({
        message: "Admin verified successfully. They can now login.",
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          isVerified: admin.isVerified
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // create a new admin user
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // validate required fields
      if (!username || !email || !password) {
        res.status(400).json({
          message: "Username, email, and password are required",
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

      // check if email already taken
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User with this email already exists",
        });
        return;
      }

      // create 6 digit otp for verification
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      // hash password and create admin
      const hashedPassword = bcrypt.hashSync(password, 10);
      const admin = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        otp,
        otpGeneratedTime: Date.now().toString(),
        isVerified: false,
      });

      // send verification email to admin
      try {
        await sendMail({
          to: email,
          subject: "Admin Account Verification - SHOEMART",
          text: `Your admin account verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to SHOEMART Admin! 👨‍💼</h2>
              <p>Hi ${username},</p>
              <p>You have been assigned as an admin for SHOEMART. Please verify your account using the OTP below:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>After verification, you can login with your email and password.</p>
              <p>Best regards,<br>SHOEMART Super Admin</p>
            </div>
          `
        });

        res.status(201).json({
          message: "Admin created successfully. Verification OTP sent to email.",
          adminId: admin.id,
          email: admin.email,
          requiresVerification: true,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // cleanup if email fails
        await admin.destroy();
        res.status(500).json({
          message: "Failed to create admin. Please try again.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get All Admins
  static async getAllAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await User.findAll({
        where: {
          role: 'admin'
        },
        attributes: ['id', 'username', 'email', 'role', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        message: "Admins fetched successfully",
        count: admins.length,
        admins: admins,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get Admin by ID
  static async getAdminById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const admin = await User.findOne({
        where: {
          id,
          role: 'admin'
        },
        attributes: ['id', 'username', 'email', 'role', 'createdAt']
      });

      if (!admin) {
        res.status(404).json({
          message: "Admin not found",
        });
        return;
      }

      res.status(200).json({
        message: "Admin fetched successfully",
        admin: admin,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Update Admin
  static async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email } = req.body;

      const admin = await User.findOne({
        where: {
          id,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          message: "Admin not found",
        });
        return;
      }

      // Check if email is already taken by another user
      if (email && email !== admin.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          res.status(400).json({
            message: "Email is already taken",
          });
          return;
        }
      }

      // Update admin
      if (username) admin.username = username;
      if (email) admin.email = email;

      await admin.save();

      res.status(200).json({
        message: "Admin updated successfully",
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          updatedAt: admin.updatedAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Delete Admin
  static async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const admin = await User.findOne({
        where: {
          id,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          message: "Admin not found",
        });
        return;
      }

      await admin.destroy();

      res.status(200).json({
        message: "Admin deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Reset Admin Password
  static async resetAdminPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({
          message: "New password is required",
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      const admin = await User.findOne({
        where: {
          id,
          role: 'admin'
        }
      });

      if (!admin) {
        res.status(404).json({
          message: "Admin not found",
        });
        return;
      }

      // Update password
      admin.password = bcrypt.hashSync(newPassword, 10);
      await admin.save();

      res.status(200).json({
        message: "Admin password reset successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get System Statistics
  static async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.count({
        where: { role: 'customer' }
      });

      const totalAdmins = await User.count({
        where: { role: 'admin' }
      });

      const totalSuperAdmins = await User.count({
        where: { role: 'super_admin' }
      });

      res.status(200).json({
        message: "System statistics fetched successfully",
        stats: {
          totalUsers,
          totalAdmins,
          totalSuperAdmins,
          totalAccounts: totalUsers + totalAdmins + totalSuperAdmins
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Resend verification email for admin
  static async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email } = req.body;

      // Find the admin by ID or email
      const admin = await User.findOne({ 
        where: { 
          [id ? 'id' : 'email']: id || email,
          role: 'admin',
          isVerified: false 
        } 
      });

      if (!admin) {
        res.status(404).json({ message: "Admin not found or already verified" });
        return;
      }

      // Generate new OTP
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      // Update admin with new OTP
      admin.otp = otp;
      admin.otpGeneratedTime = Date.now().toString();
      await admin.save();

      // Send verification email
      try {
        await sendMail({
          to: admin.email,
          subject: "Admin Account Verification - SHOEMART",
          text: `Your admin account verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Admin Account Verification - SHOEMART</h2>
              <p>Hi ${admin.username},</p>
              <p>Your admin account verification OTP is:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>After verification, you can login with your email and password.</p>
              <p>Best regards,<br>SHOEMART Super Admin</p>
            </div>
          `
        });

        res.status(200).json({ 
          message: "Verification email sent successfully",
          email: admin.email 
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default SuperAdminController; 