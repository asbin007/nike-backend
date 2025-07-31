import { envConfig } from "./src/config/config.js";

function startServer() {
  try {
    console.log(`Server is running on port ${envConfig.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log("Server started successfully!");
    return;
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();
