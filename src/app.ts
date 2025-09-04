import express from "express";
import "./database/connection.js";
import userRoute from "./routes/userRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import collectionRoute from "./routes/collectionRoute.js";
import cartRoute from './routes/cartRoute.js'
import orderRoute from './routes/orderRoute.js'
import reviewRoute from './routes/productReviewRoute.js'
import chatRoute from './routes/chatRoute.js'
import recommendationRoute from './routes/recommendationRoute.js'
import cors from "cors";
const app = express();
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://nike-frontend.vercel.app",
  "https://nike-store-frontend.vercel.app",
  "https://nike-frontend-git-main-harycan39-2994s-projects.vercel.app",
  "https://nike-frontend-henna.vercel.app"
];

// Add FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowedOrigins or matches Vercel pattern
    if (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // For debugging, allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Additional CORS middleware for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // For debugging, allow all origins
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "Nike Backend is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Root endpoint for easy testing
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Welcome to Nike Backend API!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      products: "/api/product",
      categories: "/api/category",
      orders: "/api/order"
    }
  });
});

app.use("/api/auth", userRoute);
app.use("/api/category", categoryRoute);
app.use("/api/product", productRoute);
app.use('/api/collection',collectionRoute)
app.use('/api/cart',cartRoute)
app.use('/api/order',orderRoute)
app.use('/api/review',reviewRoute)
app.use('/api/chats',chatRoute)
app.use('/api/recommendations', recommendationRoute)

app.use(express.static('./src/uploads'));

export default app;
