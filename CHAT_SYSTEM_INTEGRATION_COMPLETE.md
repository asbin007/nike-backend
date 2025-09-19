# Complete Chat System Integration Guide

## Overview
The chat system is already fully integrated across all three applications with real-time communication using Socket.io. Here's the complete setup and how to use it.

## Current Implementation Status ✅

### Backend (nike-backend) - Port 5000
- ✅ Socket.io server with authentication
- ✅ HTTP API endpoints for chat management
- ✅ Real-time message broadcasting
- ✅ Typing indicators
- ✅ Message read status
- ✅ Image upload support
- ✅ CORS configured for all frontends

### Admin Panel (admin-panel) - Port 3000
- ✅ Full chat interface (`/chat` page)
- ✅ Floating chat widget (`EnhancedChatWidget.tsx`)
- ✅ Real-time message updates
- ✅ Admin user management
- ✅ Socket.io integration
- ✅ Redux store for state management

### Nike Frontend (nike-frontend) - Port 5173
- ✅ Customer chat widget (`ChatWidget.tsx`)
- ✅ Real-time message updates
- ✅ Admin selection
- ✅ Socket.io integration
- ✅ Redux store for state management

## How to Start the Complete System

### 1. Start Backend Server
```bash
cd nike-backend
npm run dev
```
**Expected Output:**
```
Server is running on port 5000
✅ Database connection verified
✅ Database synchronized successfully
```

### 2. Start Nike Frontend (Customer)
```bash
cd nike-frontend
npm run dev
```
**Expected Output:**
```
Vite dev server running at http://localhost:5173
```

### 3. Start Admin Panel
```bash
cd admin-panel
npm run dev
```
**Expected Output:**
```
Next.js dev server running at http://localhost:3000
```

## Chat System Features

### For Customers (Nike Frontend)
1. **Floating Chat Widget**: Appears on all pages
2. **Admin Selection**: Automatically selects available admin
3. **Real-time Messaging**: Instant message delivery
4. **Image Sharing**: Upload and share images
5. **Typing Indicators**: See when admin is typing
6. **Message Status**: Read receipts and delivery status

### For Admins (Admin Panel)
1. **Full Chat Interface**: Complete chat management at `/chat`
2. **Floating Widget**: Quick access from any page
3. **Customer Management**: View all customer conversations
4. **Real-time Updates**: Instant message notifications
5. **Message History**: Complete conversation history
6. **Search Functionality**: Find specific conversations

## Socket.io Events

### Client to Server Events
- `joinChat(chatId)` - Join a chat room
- `leaveChat(chatId)` - Leave a chat room
- `sendMessage(data)` - Send a message
- `typing({chatId, userId})` - Typing indicator
- `stopTyping({chatId, userId})` - Stop typing indicator
- `markAsRead({chatId})` - Mark messages as read

### Server to Client Events
- `receiveMessage(message)` - New message received
- `newMessageNotification(data)` - Notification for new message
- `typing({chatId, userId})` - Someone is typing
- `stopTyping({chatId, userId})` - Someone stopped typing
- `messagesRead({chatId, userId})` - Messages marked as read

## API Endpoints

### Chat Management
- `POST /api/chats/get-or-create` - Create or get chat
- `GET /api/chats/all` - Get all chats for customer
- `GET /api/chats/admin/all` - Get all chats for admin
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/send-message` - Send message
- `GET /api/chats/unread/count` - Get unread count
- `GET /api/chats/admins` - Get available admins

## Testing the Integration

### 1. Test Customer Chat
1. Open http://localhost:5173
2. Login as a customer
3. Click the floating chat widget (bottom right)
4. Send a message
5. Verify message appears in admin panel

### 2. Test Admin Chat
1. Open http://localhost:3000
2. Login as an admin
3. Go to `/chat` page or use floating widget
4. Select customer conversation
5. Send a response
6. Verify message appears in customer chat

### 3. Test Real-time Features
1. Open both applications in different browser tabs
2. Send messages from customer side
3. Verify admin receives messages instantly
4. Send messages from admin side
5. Verify customer receives messages instantly
6. Test typing indicators
7. Test image sharing

## Troubleshooting

### Common Issues

1. **"No token provided" Error**
   - **Solution**: Ensure user is logged in
   - **Check**: localStorage has `tokenauth` key

2. **Socket Connection Failed**
   - **Solution**: Check if backend is running on port 5000
   - **Check**: Browser console for connection errors

3. **Messages Not Appearing**
   - **Solution**: Check Redux store state
   - **Check**: Socket.io event listeners

4. **CORS Errors**
   - **Solution**: Backend CORS is already configured
   - **Check**: All origins are in allowed list

### Debug Commands

```javascript
// Check socket connection
console.log('Socket connected:', socket?.connected);
console.log('Socket ID:', socket?.id);

// Check Redux state
console.log('Chat state:', store.getState().chatBox);

// Check authentication
console.log('Token:', localStorage.getItem('tokenauth'));
```

## Configuration Files

### Backend Configuration
- `server.ts` - Socket.io server setup
- `src/app.ts` - HTTP API and CORS
- `src/routes/chatRoute.ts` - Chat API endpoints
- `src/controllers/chatController.ts` - Chat logic

### Frontend Configuration
- `nike-frontend/src/App.tsx` - Socket.io client setup
- `admin-panel/app/app.tsx` - Socket.io client setup
- `nike-frontend/src/components/ChatWidget.tsx` - Customer chat
- `admin-panel/components/EnhancedChatWidget.tsx` - Admin chat widget
- `admin-panel/app/chat/page.tsx` - Admin chat page

## Port Configuration
- **Backend**: `localhost:5000` (configurable via PORT env var)
- **Nike Frontend**: `localhost:5173` (Vite dev server)
- **Admin Panel**: `localhost:3000` (Next.js dev server)

## Production URLs
- **Backend**: `https://nike-backend-1-g9i6.onrender.com`
- **Nike Frontend**: `https://nike-frontend.vercel.app`
- **Admin Panel**: `https://admin-panel-eight-henna.vercel.app`

## Next Steps

The chat system is fully integrated and ready to use! To test:

1. Start all three applications
2. Login as both customer and admin
3. Open chat widgets
4. Send messages between them
5. Verify real-time communication works

The system automatically handles:
- Authentication
- Real-time updates
- Message persistence
- Image sharing
- Typing indicators
- Read receipts
- Error handling
- Fallback mechanisms
