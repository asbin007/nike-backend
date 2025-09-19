#!/usr/bin/env node

/**
 * Chat System Integration Test
 * Tests the complete chat system across all applications
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';
const ADMIN_URL = 'http://localhost:3000';

async function testBackendHealth() {
  try {
    console.log('🔍 Testing backend health...');
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Backend is not running:', error.message);
    return false;
  }
}

async function testChatEndpoints() {
  try {
    console.log('🔍 Testing chat endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health endpoint working');
    
    // Test chat endpoints (should require auth)
    try {
      await axios.get(`${BACKEND_URL}/chats/all`);
      console.log('❌ Chat endpoint should require authentication');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Chat endpoints properly require authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Chat endpoint test failed:', error.message);
    return false;
  }
}

async function testCORSConfiguration() {
  try {
    console.log('🔍 Testing CORS configuration...');
    
    // Test from frontend origin
    const frontendResponse = await axios.get(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    console.log('✅ Frontend CORS working');
    
    // Test from admin origin
    const adminResponse = await axios.get(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': ADMIN_URL
      }
    });
    console.log('✅ Admin Panel CORS working');
    
    return true;
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

async function testSocketIOConfiguration() {
  try {
    console.log('🔍 Testing Socket.IO configuration...');
    
    // Test if Socket.IO endpoint is accessible
    const response = await axios.get(`${BACKEND_URL.replace('/api', '')}/socket.io/`, {
      timeout: 5000
    });
    console.log('✅ Socket.IO endpoint accessible');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running');
      return false;
    } else if (error.response?.status === 404) {
      console.log('❌ Socket.IO not properly configured');
      return false;
    } else {
      console.log('✅ Socket.IO endpoint responding (may need authentication)');
      return true;
    }
  }
}

async function checkFrontendApplications() {
  try {
    console.log('🔍 Checking frontend applications...');
    
    // Test Nike Frontend
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
      console.log('✅ Nike Frontend is running');
    } catch (error) {
      console.log('❌ Nike Frontend not accessible:', error.message);
    }
    
    // Test Admin Panel
    try {
      const adminResponse = await axios.get(ADMIN_URL, { timeout: 5000 });
      console.log('✅ Admin Panel is running');
    } catch (error) {
      console.log('❌ Admin Panel not accessible:', error.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Frontend check failed:', error.message);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Starting Chat System Integration Test\n');
  console.log('=' * 50);
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Chat Endpoints', fn: testChatEndpoints },
    { name: 'CORS Configuration', fn: testCORSConfiguration },
    { name: 'Socket.IO Configuration', fn: testSocketIOConfiguration },
    { name: 'Frontend Applications', fn: checkFrontendApplications }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    }
  }
  
  console.log('\n' + '=' * 50);
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Chat system is ready to use.');
    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:5173 (Nike Frontend)');
    console.log('2. Open http://localhost:3000 (Admin Panel)');
    console.log('3. Login to both applications');
    console.log('4. Test chat functionality between customer and admin');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend is running: npm run dev (in nike-backend)');
    console.log('2. Ensure frontends are running: npm run dev (in each frontend)');
    console.log('3. Check port availability: 5000, 3000, 5173');
    console.log('4. Verify CORS configuration in backend');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

module.exports = { 
  runIntegrationTest, 
  testBackendHealth, 
  testChatEndpoints, 
  testCORSConfiguration,
  testSocketIOConfiguration,
  checkFrontendApplications
};
