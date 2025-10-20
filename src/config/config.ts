import { config } from 'dotenv';


config();

export const envConfig = {
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRETE_KEY,
    jwtExpiration: process.env.JWT_EXPIRE_IN || '24h',
    email: process.env.EMAIL,
password: process.env.PASSWORD,
admin: process.env.ADMIN_EMAIL,
    passwordAdmin: process.env.ADMIN_PASSWORD,
    admin_username: process.env.ADMIN_USERNAME,
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
    superAdminUsername: process.env.SUPER_ADMIN_USERNAME,
    cloudinary_url: process.env.CLOUDINARY_URL,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloud_api_key: process.env.CLOUDINARY_API_KEY,
    cloud_api_secret: process.env.CLOUDINARY_API_SECRET,
    resend_api_key: process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM,
}

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRETE_KEY',
    'EMAIL',
    'PASSWORD',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'ADMIN_USERNAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    console.error('Please set these environment variables in Vercel dashboard');
    process.exit(1);
}