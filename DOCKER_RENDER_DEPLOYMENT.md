# Nike Backend - Docker Render Deployment Guide

## Prerequisites
- Render account (free tier available)
- PostgreSQL database (Render provides free tier)
- GitHub repository with Docker setup
- Environment variables ready

## Step 1: GitHub Repository Push Garnu
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Add Docker configuration for Render deployment"

# Push to GitHub
git push origin main
```

## Step 2: Render Account Setup
1. Go to [render.com](https://render.com)
2. Sign up/Sign in with GitHub
3. Connect your GitHub repository

## Step 3: Create PostgreSQL Database
1. **Dashboard ma jau**
2. **"New +" click garnu**
3. **"PostgreSQL" select garnu**
4. **Database configuration:**
   - **Name**: `nike-db`
   - **Database**: `nike_db`
   - **User**: `nike_user`
   - **Plan**: Free
5. **Create Database**

## Step 4: Get Database URL
1. **Database ma jau**
2. **"Connect" tab ma jau**
3. **"External Database URL" copy garnu**
   ```
   postgresql://nike_user:password@host:port/nike_db
   ```

## Step 5: Deploy Docker Service
1. **Dashboard ma "New +" click garnu**
2. **"Web Service" select garnu**
3. **GitHub repository connect garnu**
4. **Service configuration:**
   - **Name**: `nike-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

## Step 6: Environment Variables Set Garnu
**Environment Variables ma ye add garnu:**

### Required Variables:
```
NODE_ENV=production
PORT=10000
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

## Step 7: Deploy
1. **"Create Web Service" click garnu**
2. **Wait for Docker build and deployment**
3. **Get your service URL**

## Step 8: Update Frontend
**Frontend ma API URL update garnu:**
```javascript
// Replace localhost:5001 with your Render URL
const API_URL = "https://your-app-name.onrender.com";
```

## Docker Configuration Details

### Dockerfile Features:
- ✅ Multi-stage build for optimization
- ✅ Security with non-root user
- ✅ Health checks
- ✅ Signal handling with dumb-init
- ✅ Production-optimized

### Build Process:
1. **Builder stage**: Install dependencies and build TypeScript
2. **Production stage**: Copy only necessary files
3. **Security**: Run as non-root user
4. **Health checks**: Monitor application health

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

### 4. PORT
- Render automatically sets PORT environment variable
- Default: 10000 (for health checks)

## Troubleshooting

### Docker Build Errors
1. Check build logs in Render dashboard
2. Ensure Dockerfile syntax is correct
3. Verify all dependencies in package.json

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
- [ ] Docker service deployed successfully
- [ ] Health check endpoint working
- [ ] Frontend API URL updated
- [ ] Email functionality tested
- [ ] File uploads working (if using Cloudinary)

## Useful Commands
```bash
# Local Docker build test
docker build -t nike-backend .

# Local Docker run test
docker run -p 10000:10000 nike-backend

# Check service logs
# Available in Render dashboard

# Restart service
# Available in Render dashboard
```

## Support
- Render documentation: https://render.com/docs
- Docker documentation: https://docs.docker.com/
- PostgreSQL setup: https://render.com/docs/databases
- Environment variables: https://render.com/docs/environment-variables

## Benefits of Docker Deployment
- ✅ Consistent environment across development and production
- ✅ Easy scaling and deployment
- ✅ Better security with non-root user
- ✅ Health checks and monitoring
- ✅ Optimized build process 