#!/usr/bin/env node

/**
 * Create Support Admin Script
 * Creates a dedicated admin user for customer support
 */

import axios from 'axios';
import bcrypt from 'bcryptjs';

const BACKEND_URL = 'http://localhost:5000/api';

async function createSupportAdmin() {
  try {
    console.log('🔍 Creating dedicated support admin...');
    
    // Create admin user data
    const adminData = {
      username: 'support_admin',
      email: 'support@nike.com',
      password: 'support123',
      role: 'admin',
      isVerified: true
    };

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    adminData.password = hashedPassword;

    // Register admin
    const response = await axios.post(`${BACKEND_URL}/auth/register`, adminData);
    
    if (response.data.success) {
      console.log('✅ Support admin created successfully!');
      console.log('📧 Email:', adminData.email);
      console.log('👤 Username:', adminData.username);
      console.log('🔑 Password:', 'support123');
      console.log('🎭 Role:', adminData.role);
      return response.data.data;
    } else {
      console.log('❌ Failed to create support admin:', response.data.message);
      return null;
    }
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Support admin already exists');
      return { id: 'existing', email: 'support@nike.com' };
    } else {
      console.log('❌ Error creating support admin:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

async function getSupportAdminId() {
  try {
    console.log('🔍 Getting support admin ID...');
    
    // Try to login to get admin ID
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'support@nike.com',
      password: 'support123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Support admin login successful');
      return loginResponse.data.data.user.id;
    }
  } catch (error) {
    console.log('❌ Error logging in support admin:', error.response?.data?.message || error.message);
  }
  
  return null;
}

async function main() {
  console.log('🚀 Setting up Support Admin for Customer Chat\n');
  console.log('=' * 50);
  
  // Create support admin
  const admin = await createSupportAdmin();
  
  if (admin) {
    // Get admin ID
    const adminId = await getSupportAdminId();
    
    if (adminId) {
      console.log('\n✅ Support Admin Setup Complete!');
      console.log('📋 Admin Details:');
      console.log(`   ID: ${adminId}`);
      console.log(`   Email: support@nike.com`);
      console.log(`   Username: support_admin`);
      console.log(`   Password: support123`);
      console.log(`   Role: admin`);
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Use this admin ID in the chatbot configuration');
      console.log('2. Customers can now chat anonymously with this admin');
      console.log('3. Admin can respond to customer queries in real-time');
      
      return adminId;
    } else {
      console.log('❌ Failed to get admin ID');
      return null;
    }
  } else {
    console.log('❌ Failed to create support admin');
    return null;
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createSupportAdmin, getSupportAdminId };
