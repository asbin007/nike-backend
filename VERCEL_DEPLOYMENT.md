# Vercel Deployment Guide - Nike Backend

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with your code
- Environment variables ready

## Deployment Steps

### 1. Environment Variables Setup
Vercel dashboard ma ye environment variables add garnu parcha:

```
DATABASE_URL=your_postgresql_database_url
JWT_SECRETE_KEY=your_jwt_secret_key
JWT_EXPIRE_IN=24h
EMAIL=your_email@gmail.com
PASSWORD=your_email_password
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
ADMIN_USERNAME=admin
CLOUDINARY_URL=your_cloudinary_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Database Setup
- PostgreSQL database use garnu parcha (Vercel ma serverless functions le local database support gardaina)
- Supabase, Railway, or any cloud PostgreSQL provider use garna sakincha

### 3. Vercel Deployment
1. **Vercel CLI install garnu:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

   Ya GitHub repository connect garera automatic deployment garna sakincha.

### 4. Manual Deployment via GitHub
1. GitHub ma code push garnu
2. Vercel dashboard ma "New Project" click garnu
3. GitHub repository import garnu
4. Environment variables add garnu
5. Deploy garnu

## Important Notes

### CORS Configuration
Frontend URL haru update garnu parcha `src/app.ts` ma:

```typescript
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app" // Add your frontend URL
  ],
  credentials: true
}));
```

### Socket.IO Configuration
Socket.IO ko CORS configuration update garnu parcha `server.ts` ma:

```typescript
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:3000",
      "https://your-frontend-domain.vercel.app" // Add your frontend URL
    ],
  },
});
```

### File Upload
- Cloudinary use gareko cha, so file upload properly work garne cha
- Local file upload Vercel ma work gardaina

### Database Migrations
- Database tables automatically create huncha Sequelize le
- Admin user automatically seed huncha

## Post-Deployment

### 1. Test API Endpoints
Deployed URL ma API endpoints test garnu:
```
https://your-backend.vercel.app/api/health
```

### 2. Update Frontend
Frontend ma API base URL update garnu:
```javascript
const API_BASE_URL = "https://your-backend.vercel.app";
```

### 3. Socket.IO Connection
Frontend ma Socket.IO connection update garnu:
```javascript
const socket = io("https://your-backend.vercel.app", {
  auth: { token: userToken }
});
```

## Troubleshooting

### Common Issues:
1. **Environment Variables**: Sabai environment variables properly set garnu parcha
2. **Database Connection**: PostgreSQL database accessible hunu parcha
3. **CORS Errors**: Frontend URL properly configure garnu parcha
4. **Build Errors**: TypeScript compilation errors fix garnu parcha

### Vercel Logs Check:
Vercel dashboard ma "Functions" section ma logs check garna sakincha.

## Support
Koi problem aaye ma help garna sakchu! 