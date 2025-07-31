import bcrypt from 'bcrypt';
import { envConfig } from './config/config.js';
import User from "./database/models/userModel.js";

// this function creates the first super admin if it doesn't exist
const superAdminSeeder = async () => {
  try {
    // first check if we already have a super admin
    const existingSuperAdmin = await User.findOne({
      where: {
        role: 'super_admin'
      }
    });

    if (!existingSuperAdmin) {
      // no super admin found, so create one
      const superAdminPass = envConfig.super_admin_password as string
      const hashedPass = bcrypt.hashSync(superAdminPass, 10);
      
      await User.create({
        username: envConfig.super_admin_username,
        email: envConfig.super_admin_email,
        password: hashedPass,
        role: 'super_admin'
      });
      
      console.log("Super Admin created successfully!");
      console.log("Email:", envConfig.super_admin_email);
      console.log("Password:", superAdminPass);
    } else {
      console.log("Super Admin already exists, skipping...");
    }
  } catch (error) {
    console.error("Failed to create super admin:", error);
  }
};

export default superAdminSeeder; 