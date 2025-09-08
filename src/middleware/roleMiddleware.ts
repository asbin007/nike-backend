import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/config.js";
import User from "../database/models/userModel.js";

export enum Role {
  Admin = "admin",
  Customer = "customer",
}

// Middleware to check if user has specific role
export const requireRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization;
      
      if (!token) {
        res.status(401).json({
          message: "Access denied. No token provided.",
        });
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, envConfig.jwtSecret as string) as any;
      
      // Get user from database
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        res.status(401).json({
          message: "Access denied. User not found.",
        });
        return;
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(user.role as Role)) {
        res.status(403).json({
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}`,
        });
        return;
      }

      // Add user info to request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(401).json({
        message: "Access denied. Invalid token.",
      });
    }
  };
};

// Middleware specifically for customer-only routes
export const requireCustomer = requireRole([Role.Customer]);

// Middleware specifically for admin-only routes  
export const requireAdmin = requireRole([Role.Admin]);
