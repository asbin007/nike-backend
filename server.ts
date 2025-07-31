// Minimal server for deployment testing
function startServer() {
  try {
    console.log('Starting minimal server...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    const port = process.env.PORT || 10000;
    console.log(`Port: ${port}`);
    
    // Simple HTTP server for testing
    const http = require('http');
    const server = http.createServer((req: any, res: any) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Server is running successfully!');
    });
    
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
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
