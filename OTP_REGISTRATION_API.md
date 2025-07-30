# 🚀 OTP-Based Registration API Documentation

## 📋 Overview
This API implements a secure registration system using password and OTP verification.

## 🔐 API Endpoints

### 1. User Registration
**POST** `/api/auth/register`

Register a new user with password and OTP verification.

#### Request Body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Response (Success - 201):
```json
{
  "message": "User registered successfully. Please check your email for OTP.",
  "userId": "uuid",
  "email": "john@example.com",
  "requiresOtp": true
}
```

#### Response (Error - 400):
```json
{
  "message": "Password must be at least 6 characters long"
}
```

### 2. OTP Verification
**POST** `/api/auth/verify-otp`

Verify the OTP sent to user's email to complete registration.

#### Request Body:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Response (Success - 200):
```json
{
  "message": "OTP verified successfully! You can now login.",
  "userId": "uuid",
  "email": "john@example.com"
}
```

#### Response (Error - 400):
```json
{
  "message": "Invalid OTP"
}
```

### 3. Resend OTP
**POST** `/api/auth/resend-otp`

Resend OTP if the previous one expired or wasn't received.

#### Request Body:
```json
{
  "email": "john@example.com"
}
```

#### Response (Success - 200):
```json
{
  "message": "New OTP sent to your email",
  "email": "john@example.com"
}
```

### 4. User Login
**POST** `/api/auth/login`

Login after successful OTP verification.

#### Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Response (Success - 201):
```json
{
  "message": "User logged in successfully",
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "token": "jwt_token"
}
```

## 🔧 Features

### ✅ Password Requirements:
- Minimum 6 characters
- Clear validation messages

### ✅ OTP System:
- 6-digit numeric OTP
- 10-minute expiration
- Beautiful HTML email template
- Resend functionality

### ✅ Security Features:
- Password hashing with bcrypt
- OTP expiration check
- User cleanup on email failure
- JWT token generation

### ✅ Email Features:
- Professional HTML template
- Text fallback
- Nike Store branding
- Clear instructions

## 📧 Email Template

### HTML Email:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Welcome to Nike Store! 🏃‍♂️</h2>
  <p>Hi [username],</p>
  <p>Thank you for registering with Nike Store. Please complete your registration using the OTP below:</p>
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
    <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">[OTP]</h1>
  </div>
  <p><strong>This OTP will expire in 10 minutes.</strong></p>
  <p>If you didn't create this account, please ignore this email.</p>
  <p>Best regards,<br>Nike Store Team</p>
</div>
```

## 🔄 Complete Flow

### Step 1: Registration
1. User submits registration form
2. System validates password (min 6 chars)
3. System checks if email exists
4. System generates 6-digit OTP
5. System sends OTP email
6. User receives success message

### Step 2: OTP Verification
1. User enters OTP from email
2. System validates OTP
3. System checks OTP expiration
4. System clears OTP after verification
5. User can now login

### Step 3: Login
1. User enters email and password
2. System validates credentials
3. System generates JWT token
4. User receives access token

## 🛡️ Security Features

### Password Security:
- Minimum 6 characters required
- Bcrypt hashing (salt rounds: 10)
- Secure password storage

### OTP Security:
- 6-digit numeric only
- 10-minute expiration
- One-time use (cleared after verification)
- Rate limiting through email sending

### Email Security:
- Professional templates
- Clear instructions
- Expiration warnings
- Security disclaimers

## 📝 Error Handling

### Common Error Responses:

#### 400 - Bad Request:
```json
{
  "message": "Fill all the fields"
}
```

#### 403 - Forbidden:
```json
{
  "message": "OTP expired. Please request a new one."
}
```

#### 404 - Not Found:
```json
{
  "message": "User not found"
}
```

#### 500 - Internal Server Error:
```json
{
  "message": "Internal server error"
}
```

## 🎯 Benefits

### For Users:
- ✅ Simple registration process
- ✅ Secure password requirements
- ✅ Email verification
- ✅ Professional experience

### For System:
- ✅ Reduced fake accounts
- ✅ Better security
- ✅ User data validation
- ✅ Professional appearance

---

**🎉 This OTP-based registration system provides a secure and user-friendly registration experience!** 