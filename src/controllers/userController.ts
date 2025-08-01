import { Role } from './../middleware/userMiddleware.js';
import otpGenerator from "otp-generator";
import { envConfig } from "./../config/config.js";
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response } from "express";
import User from "../database/models/userModel.js";
import bcrypt from "bcrypt";
import sendMail from "../services/sendMail.js";
import checkOtpExpiration from "../services/optExpiration.js";

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
          subject: "Registration OTP - Nike Store",
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



      const token = jwt.sign(
        { userId: user.id },
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

  static async deleteUser(req: Request, res: Response) {
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
    await User.destroy({
      where: {
        id,
      },
    });
    res.status(201).json({
      message: "User delete Successfully",
    });
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
        { userId: user.id },
        envConfig.jwtSecret as Secret,
        {
          expiresIn: "30d",
        }
      );

      res.status(201).json({
        message: "Admin logged in successfully",
        token,
      
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

}


export default UserController;
