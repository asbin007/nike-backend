// Minimal server for deployment testing
function startServer() {
  try {
    console.log('Starting minimal server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${process.env.PORT || 5001}`);
    
    // Simple HTTP server for testing
    const http = require('http');
    const server = http.createServer((req: any, res: any) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Server is running successfully!');
    });
    
    server.listen(process.env.PORT || 5001, () => {
      console.log(`Server is running on port ${process.env.PORT || 5001}`);
      console.log('Minimal server started successfully!');
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// For production deployment (Render/Vercel)
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export for serverless deployment
export default startServer;
