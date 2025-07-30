# 👑 Super Admin API Documentation

## 📋 Overview
This API provides super admin functionality to manage the entire SHOEMART system, including creating and managing admin users.

## 🔐 Authentication
All super admin endpoints (except login) require a valid JWT token with super_admin role.

## 🚀 API Endpoints

### 1. Super Admin Login
**POST** `/api/super-admin/login`

Login as super admin.

#### Request Body:
```json
{
  "email": "superadmin@shoemart.com",
  "password": "superadmin123"
}
```

#### Response (Success - 200):
```json
{
  "message": "Super admin logged in successfully",
  "id": "uuid",
  "username": "superadmin",
  "email": "superadmin@shoemart.com",
  "role": "super_admin",
  "token": "jwt_token"
}
```

### 2. Create Admin
**POST** `/api/super-admin/admins`

Create a new admin user (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Request Body:
```json
{
  "username": "admin_user",
  "email": "admin@shoemart.com",
  "password": "admin123"
}
```

#### Response (Success - 201):
```json
{
  "message": "Admin created successfully. Verification OTP sent to email.",
  "adminId": "uuid",
  "email": "admin@shoemart.com",
  "requiresVerification": true
}
```

### 3. Get All Admins
**GET** `/api/super-admin/admins`

Get list of all admin users (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Response (Success - 200):
```json
{
  "message": "Admins fetched successfully",
  "count": 2,
  "admins": [
    {
      "id": "uuid1",
      "username": "admin1",
      "email": "admin1@shoemart.com",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid2",
      "username": "admin2",
      "email": "admin2@shoemart.com",
      "role": "admin",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### 4. Get Admin by ID
**GET** `/api/super-admin/admins/:id`

Get specific admin details (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Response (Success - 200):
```json
{
  "message": "Admin fetched successfully",
  "admin": {
    "id": "uuid",
    "username": "admin_user",
    "email": "admin@shoemart.com",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Update Admin
**PUT** `/api/super-admin/admins/:id`

Update admin information (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Request Body:
```json
{
  "username": "updated_admin",
  "email": "updated@shoemart.com"
}
```

#### Response (Success - 200):
```json
{
  "message": "Admin updated successfully",
  "admin": {
    "id": "uuid",
    "username": "updated_admin",
    "email": "updated@shoemart.com",
    "role": "admin",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Delete Admin
**DELETE** `/api/super-admin/admins/:id`

Delete an admin user (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Response (Success - 200):
```json
{
  "message": "Admin deleted successfully"
}
```

### 7. Reset Admin Password
**PUT** `/api/super-admin/admins/:id/reset-password`

Reset admin password (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Request Body:
```json
{
  "newPassword": "newpassword123"
}
```

#### Response (Success - 200):
```json
{
  "message": "Admin password reset successfully"
}
```

### 8. Get System Statistics
**GET** `/api/super-admin/stats`

Get system-wide statistics (requires super admin token).

#### Headers:
```
Authorization: Bearer <super_admin_token>
```

#### Response (Success - 200):
```json
{
  "message": "System statistics fetched successfully",
  "stats": {
    "totalUsers": 150,
    "totalAdmins": 5,
    "totalSuperAdmins": 1,
    "totalAccounts": 156
  }
}
```

## 🔧 Features

### ✅ Super Admin Capabilities:
- Create new admin users
- View all admin users
- Update admin information
- Delete admin users
- Reset admin passwords
- View system statistics

### ✅ Security Features:
- JWT token authentication
- Role-based access control
- Password validation
- Email verification for new admins
- Secure password hashing

### ✅ Admin Creation Process:
1. Super admin creates admin account
2. System sends OTP to admin's email
3. Admin verifies email with OTP
4. Admin can login with credentials

## 📧 Email Templates

### Admin Creation Email:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Welcome to SHOEMART Admin! 👨‍💼</h2>
  <p>Hi [username],</p>
  <p>You have been assigned as an admin for SHOEMART. Please verify your account using the OTP below:</p>
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
    <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">[OTP]</h1>
  </div>
  <p><strong>This OTP will expire in 10 minutes.</strong></p>
  <p>After verification, you can login with your email and password.</p>
  <p>Best regards,<br>SHOEMART Super Admin</p>
</div>
```

## 🛡️ Security

### Authentication:
- JWT tokens with 30-day expiration
- Role-based middleware protection
- Super admin only access

### Password Security:
- Minimum 6 characters required
- Bcrypt hashing (salt rounds: 10)
- Secure password reset functionality

### Access Control:
- Super admin can manage all admins
- Admins cannot access super admin functions
- Customers cannot access admin functions

## 📝 Error Handling

### Common Error Responses:

#### 400 - Bad Request:
```json
{
  "message": "Username, email, and password are required"
}
```

#### 401 - Unauthorized:
```json
{
  "message": "Token must be provided"
}
```

#### 403 - Forbidden:
```json
{
  "message": "Access denied. Super admin only."
}
```

#### 404 - Not Found:
```json
{
  "message": "Admin not found"
}
```

#### 500 - Internal Server Error:
```json
{
  "message": "Internal server error"
}
```

## 🎯 Environment Variables

Add these to your `.env` file:

```env
# Super Admin Credentials
SUPER_ADMIN_EMAIL=superadmin@shoemart.com
SUPER_ADMIN_PASSWORD=superadmin123
SUPER_ADMIN_USERNAME=superadmin
```

## 🔄 Complete Workflow

### 1. Super Admin Setup:
1. Set environment variables
2. Run application (seeder creates super admin)
3. Login with super admin credentials

### 2. Admin Management:
1. Super admin creates new admin
2. System sends verification email
3. Admin verifies email with OTP
4. Admin can login and access admin panel

### 3. System Monitoring:
1. Super admin can view all admins
2. Monitor system statistics
3. Manage admin permissions
4. Reset admin passwords if needed

## 🎯 Benefits

### For Super Admin:
- ✅ Complete system control
- ✅ Admin user management
- ✅ System monitoring
- ✅ Security oversight

### For System:
- ✅ Hierarchical access control
- ✅ Secure admin creation
- ✅ Audit trail
- ✅ Centralized management

---

**👑 This super admin system provides complete control over the SHOEMART platform!** 