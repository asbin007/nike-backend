# Nike Backend API

A clean and simple Node.js backend API for Nike e-commerce application.

## 🚀 Features

- **User Authentication** - Register, login, OTP verification
- **Product Management** - Categories, products, collections
- **Shopping Cart** - Add, remove, update cart items
- **Order Management** - Create and track orders
- **Payment Integration** - Secure payment processing
- **Real-time Chat** - Customer support chat system
- **File Upload** - Image upload with Cloudinary

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **Express.js** - Web framework
- **Sequelize** - ORM for database
- **PostgreSQL** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File upload
- **Cloudinary** - Image storage

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
```

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📚 API Documentation

- **Auth Routes**: `/api/auth/*`
- **Products**: `/api/product/*`
- **Categories**: `/api/category/*`
- **Cart**: `/api/cart/*`
- **Orders**: `/api/order/*`
- **Chat**: `/api/chats/*`

## 🚀 Deployment

This project is designed to work with any hosting platform:
- Railway.app
- Vercel
- Heroku
- DigitalOcean
- AWS

## 📝 License

ISC License
