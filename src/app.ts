import express from "express";
import "./database/connection";
import userRoute from "./routes/userRoute";
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


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://nike-frontend.vercel.app",
      "https://nike-store-frontend.vercel.app",
      "https://nike-store-frontend.vercel.app", // Add your actual frontend URL
      "https://nike-frontend.vercel.app", // Add your actual frontend URL
      "*" // Temporary for testing - remove this later
    ],
    credentials: true
  })
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    message: "Nike Backend is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
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

app.use(express.static('./src/uploads'));

export default app;
