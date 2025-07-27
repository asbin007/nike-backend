import { Role } from './../middleware/userMiddleware';
import otpGenerator from "otp-generator";
import { envConfig } from "./../config/config";
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response } from "express";
import User from "../database/models/userModel";
import bcrypt from "bcrypt";

import sendMail from "../services/sendMail";
import checkOtpExpiration from "../services/optExpiration";
import { promises } from "nodemailer/lib/xoauth2";

class UserController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User already exists",
        });
        return;
      }

      const data = await User.create({
        username,
        email,
        password: bcrypt.hashSync(password, 10),
      });

      res.status(201).json({
        message: "User registered successfully",
        data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error,
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
