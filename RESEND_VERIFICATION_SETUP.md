# Backend Resend Verification Setup Guide

## 🔧 **Backend Implementation for Resend Email Verification**

This guide documents the implementation of resend verification functionality in your Nike backend.

## ✅ **What's Already Implemented**

### **1. UserController Features**
- ✅ `resendOtp` method - Resends OTP for user email verification
- ✅ `verifyOtp` method - Verifies OTP and marks user as verified
- ✅ Routes already configured in `userRoute.ts`

### **2. SuperAdminController Features**
- ✅ `resendVerificationEmail` method - Resends verification email for admin accounts
- ✅ Routes configured in `superAdminRoute.ts`

### **3. Database Model**
- ✅ `isVerified` field added to User model
- ✅ `otp` and `otpGeneratedTime` fields already exist

## 📁 **API Endpoints**

### **User Verification Endpoints**
```
POST /api/auth/resend-otp
POST /api/auth/verify-otp
```

### **Super Admin Verification Endpoints**
```
POST /api/super-admin/admins/:id/resend-verification
POST /api/super-admin/resend-verification
```

## 🚀 **Testing the Implementation**

### **1. Test User Resend OTP:**
```bash
curl -X POST http://localhost:5001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### **2. Test User OTP Verification:**
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'
```

### **3. Test Super Admin Resend Verification:**
```bash
# Test resend verification for specific admin
curl -X POST http://localhost:5001/api/super-admin/admins/123/resend-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{"email": "admin@example.com"}'

# Test general resend verification
curl -X POST http://localhost:5001/api/super-admin/resend-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{"email": "admin@example.com"}'
```

## 📋 **Database Migration**

Run this SQL command to add the `isVerified` field:

```sql
-- Add isVerified field to users table
ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (optional)
UPDATE users SET isVerified = TRUE WHERE isVerified IS NULL;
```

## 🔧 **Configuration Requirements**

### **Email Service Setup**
Ensure your email service is properly configured in `services/sendMail.ts` with these environment variables:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
```

### **Required Packages**
All required packages are already installed:
- ✅ `otp-generator` - For generating OTP codes
- ✅ `nodemailer` - For sending emails
- ✅ `bcrypt` - For password hashing
- ✅ `jsonwebtoken` - For JWT tokens

## 📝 **Response Formats**

### **Successful Resend OTP Response:**
```json
{
  "message": "New OTP sent to your email",
  "email": "user@example.com"
}
```

### **Successful OTP Verification Response:**
```json
{
  "message": "OTP verified successfully! You can now login.",
  "userId": "user-id",
  "email": "user@example.com",
  "isVerified": true
}
```

### **Successful Admin Verification Email Response:**
```json
{
  "message": "Verification email sent successfully",
  "email": "admin@example.com"
}
```

## ⚠️ **Error Handling**

The implementation includes comprehensive error handling for:
- Invalid email addresses
- User not found
- OTP expiration (10 minutes)
- Email sending failures
- Database errors

## 🔒 **Security Features**

- OTP expires after 10 minutes
- OTP is cleared after successful verification
- Users are marked as verified only after successful OTP verification
- Super admin authentication required for admin verification endpoints

## 📧 **Email Templates**

The system uses beautiful HTML email templates for:
- User registration OTP
- Admin account verification OTP
- Password reset OTP

All emails include:
- Professional branding
- Clear OTP display
- Expiration warnings
- Responsive design

## 🎯 **Next Steps**

1. **Run the database migration** to add the `isVerified` field
2. **Test all endpoints** using the provided curl commands
3. **Configure email service** with your SMTP credentials
4. **Update frontend** to handle the new verification flow
5. **Monitor email delivery** and OTP verification success rates

## 📞 **Support**

If you encounter any issues:
1. Check the server logs for detailed error messages
2. Verify your email service configuration
3. Ensure the database migration has been applied
4. Test with the provided curl commands

---

**Implementation Status: ✅ Complete**
**Last Updated: Current**
**Version: 1.0.0** 