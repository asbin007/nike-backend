# Nike Backend - Render Deployment Guide

## Prerequisites
- Render account (free tier available)
- PostgreSQL database (Render provides free tier)
- Environment variables ready

## Step 1: Render Account Setup
1. Go to [render.com](https://render.com)
2. Sign up/Sign in with GitHub
3. Connect your GitHub repository

## Step 2: Create PostgreSQL Database
1. **Dashboard ma jau**
2. **"New +" click garnu**
3. **"PostgreSQL" select garnu**
4. **Database configuration:**
   - **Name**: `nike-db`
   - **Database**: `nike_db`
   - **User**: `nike_user`
   - **Plan**: Free
5. **Create Database**

## Step 3: Get Database URL
1. **Database ma jau**
2. **"Connect" tab ma jau**
3. **"External Database URL" copy garnu**
   ```
   postgresql://nike_user:password@host:port/nike_db
   ```

## Step 4: Deploy Backend Service
1. **Dashboard ma "New +" click garnu**
2. **"Web Service" select garnu**
3. **GitHub repository connect garnu**
4. **Service configuration:**
   - **Name**: `nike-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run render-ts`
   - **Plan**: Free

## Step 5: Environment Variables Set Garnu
**Environment Variables ma ye add garnu:**

### Required Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://nike_user:password@host:port/nike_db
JWT_SECRETE_KEY=your_super_secret_jwt_key_here
EMAIL=your_email@gmail.com
PASSWORD=your_email_app_password
```

### Optional Variables:
```
ADMIN_EMAIL=admin@nike.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin
CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

## Step 6: Deploy
1. **"Create Web Service" click garnu**
2. **Wait for deployment to complete**
3. **Get your service URL**

## Step 7: Update Frontend
**Frontend ma API URL update garnu:**
```javascript
// Replace localhost:5001 with your Render URL
const API_URL = "https://your-app-name.onrender.com";
```

## Environment Variables Guide

### 1. DATABASE_URL
- Render PostgreSQL database URL
- Format: `postgresql://user:password@host:port/database`

### 2. JWT_SECRETE_KEY
- Strong secret key for JWT tokens
- Example: `my-super-secret-jwt-key-2024`

### 3. EMAIL & PASSWORD
- Gmail account for sending OTP emails
- Use App Password (not regular password)
- Enable 2FA and generate App Password

### 4. CLOUDINARY (Optional)
- For image uploads
- Sign up at cloudinary.com
- Get API credentials

## Troubleshooting

### Build Errors
1. Check build logs
2. Ensure all dependencies in package.json
3. Verify TypeScript compilation

### Database Connection
1. Verify DATABASE_URL format
2. Check database credentials
3. Ensure database is running

### Email Issues
1. Use App Password, not regular password
2. Enable "Less secure app access"
3. Check Gmail settings

## Production Checklist
- [ ] Database created and connected
- [ ] Environment variables set
- [ ] Service deployed successfully
- [ ] Health check endpoint working
- [ ] Frontend API URL updated
- [ ] Email functionality tested
- [ ] File uploads working (if using Cloudinary)

## Useful Commands
```bash
# Check service logs
# Available in Render dashboard

# Restart service
# Available in Render dashboard

# View environment variables
# Available in Render dashboard
```

## Support
- Render documentation: https://render.com/docs
- PostgreSQL setup: https://render.com/docs/databases
- Environment variables: https://render.com/docs/environment-variables 