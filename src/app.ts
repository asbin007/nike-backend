import express from "express";
import "./database/connection.js";
import userRoute from "./routes/userRoute.js";
import superAdminRoute from "./routes/superAdminRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import collectionRoute from "./routes/collectionRoute.js";
import cartRoute from './routes/cartRoute.js'
import orderRoute from './routes/orderRoute.js'
import reviewRoute from './routes/productReviewRoute.js'
import chatRoute from './routes/chatRoute.js'
import cors from "cors";
const app = express();
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://nike-frontend.vercel.app",
  "https://nike-store-frontend.vercel.app"
];

// Add FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));

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
app.use("/api/super-admin", superAdminRoute);
app.use("/api/category", categoryRoute);
app.use("/api/product", productRoute);
app.use('/api/collection',collectionRoute)
app.use('/api/cart',cartRoute)
app.use('/api/order',orderRoute)
app.use('/api/review',reviewRoute)
app.use('/api/chats',chatRoute)

app.use(express.static('./src/uploads'));

export default app;
