# Chat System Integration Guide

## Overview
This guide explains how the chat system is integrated across the Nike Backend (port 5000), Admin Panel (port 3000), and Nike Frontend (port 5173) using Socket.io.

## Architecture

### Backend (nike-backend) - Port 5000
- **Socket.io Server**: Handles real-time communication
- **HTTP API**: REST endpoints for chat management
- **Authentication**: JWT tokens for both socket and HTTP requests

### Frontend Applications
- **Nike Frontend** (port 5173): Customer-facing application
- **Admin Panel** (port 3000): Admin management interface

## Current Configuration

### Backend URLs
- **Localhost**: `http://localhost:5000/api`
- **Production**: `https://nike-backend-1-g9i6.onrender.com/api`

### Port Configuration
- **Backend**: 5000 (default, configurable via PORT env var)
- **Nike Frontend**: 5173 (Vite dev server)
- **Admin Panel**: 3000 (Next.js dev server)

## Authentication Flow

### Socket.io Authentication
```javascript
// Frontend connects with token
const socket = io(backendUrl, {
  auth: {
    token: localStorage.getItem('tokenauth')
  }
});
```

### HTTP API Authentication
```javascript
// Frontend sends token in Authorization header
const response = await APIS.get('/chats/all', {
  headers: {
    Authorization: localStorage.getItem('tokenauth')
  }
});
```

## Chat Features

### Real-time Features
- ✅ Send messages instantly
- ✅ Receive messages in real-time
- ✅ Typing indicators
- ✅ Message read status
- ✅ Online user tracking

### HTTP API Features
- ✅ Create/get chat sessions
- ✅ Fetch chat history
- ✅ Get unread message count
- ✅ Admin chat statistics

## Troubleshooting

### Common Issues

1. **"No token provided" Error**
   - **Cause**: Token not sent in Authorization header
   - **Solution**: Ensure frontend is using APIS instance with token interceptor

2. **CORS Issues**
   - **Cause**: Origin not in allowed list
   - **Solution**: Check CORS configuration in server.ts and app.ts

3. **Socket Connection Fails**
   - **Cause**: Backend not running or wrong URL
   - **Solution**: Verify backend is running on port 5000

### Debug Steps

1. Check browser console for errors
2. Verify token exists in localStorage
3. Check network tab for failed requests
4. Verify backend is running and accessible

## Testing the Integration

### 1. Start Backend
```bash
cd nike-backend
npm run dev
```

### 2. Start Nike Frontend
```bash
cd nike-frontend
npm run dev
```

### 3. Start Admin Panel
```bash
cd admin-panel
npm run dev
```

### 4. Test Chat
1. Login to both applications
2. Create a chat session
3. Send messages between customer and admin
4. Verify real-time updates

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRETE_KEY=your_jwt_secret
DATABASE_URL=your_database_url
```

### Frontend
- No additional env vars needed
- Backend URL is auto-detected (localhost vs production)

## Socket Events

### Client to Server
- `joinChat(chatId)` - Join a chat room
- `leaveChat(chatId)` - Leave a chat room
- `sendMessage(data)` - Send a message
- `typing({chatId, userId})` - Typing indicator
- `stopTyping({chatId, userId})` - Stop typing indicator
- `markAsRead({chatId})` - Mark messages as read

### Server to Client
- `receiveMessage(message)` - New message received
- `newMessageNotification(data)` - Notification for new message
- `typing({chatId, userId})` - Someone is typing
- `stopTyping({chatId, userId})` - Someone stopped typing
- `messagesRead({chatId, userId})` - Messages marked as read

## API Endpoints

### Chat Management
- `POST /api/chats/get-or-create` - Create or get chat
- `GET /api/chats/all` - Get all chats for user
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/send-message` - Send message
- `GET /api/chats/unread/count` - Get unread count

### Admin Only
- `GET /api/chats/admin/all` - Get all chats (admin)
- `GET /api/chats/stats` - Get chat statistics
- `POST /api/chats/admin/send-message` - Send message as admin
