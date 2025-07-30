import express from "express";
import "./database/connection";
import userRoute from "./routes/userRoute";
import superAdminRoute from "./routes/superAdminRoute";
import categoryRoute from "./routes/categoryRoute";
import productRoute from "./routes/productRoute";
import collectionRoute from "./routes/collectionRoute";
import cartRoute from './routes/cartRoute'
import orderRoute from './routes/orderRoute'
import reviewRoute from './routes/productReviewRoute'
import chatRoute from './routes/chatRoute'
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
