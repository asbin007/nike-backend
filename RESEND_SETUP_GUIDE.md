# Resend Email Service Setup Guide

## For Gmail OTP Verification

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up/Login to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Set Environment Variables
Add these to your Render.com environment variables:

```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=noreply@yourdomain.com
```

### 3. Domain Verification (Optional but Recommended)
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., yourdomain.com)
3. Add the required DNS records
4. Verify your domain
5. Update `RESEND_FROM` to use your verified domain

### 4. For Testing (No Domain Required)
If you don't have a domain, you can use:
```bash
RESEND_FROM=onboarding@resend.dev
```

### 5. Test Email Sending
The service will automatically:
1. Try Resend first (if configured)
2. Fall back to Gmail if Resend fails
3. Log OTP to console if all providers fail

### 6. Monitor Logs
Check your Render.com logs to see:
- ✅ Email sent successfully via resend
- 📧 Email details: To=user@gmail.com, Subject=OTP Verification
- Or error messages with helpful tips

## Current Configuration
- **Primary**: Resend (if API key configured)
- **Fallback**: Gmail SMTP
- **Last Resort**: Console logging

## Troubleshooting
- If you see "validation_error": Verify your domain or use onboarding@resend.dev
- If you see "rate_limit": Wait a few minutes and try again
- If all providers fail: Check console logs for the OTP
