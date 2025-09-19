# New Chat System - Built from Scratch

## Overview
This is a completely new, simple chat system built from scratch using Socket.io. All previous chat code has been removed and replaced with a clean, minimal implementation.

## Architecture

### Backend (nike-backend) - Port 5000
- **Database Models**: `Chat` and `Message` models
- **API Endpoints**: RESTful endpoints for chat management
- **Socket.io Server**: Real-time messaging with authentication
- **Features**: Join/leave rooms, send messages, typing indicators, read receipts

### Frontend Applications
- **Nike Frontend** (port 5173): `CustomerChat` component
- **Admin Panel** (port 3000): `AdminChat` component

## Database Models

### Chat Model
```typescript
interface Chat {
  id: string;
  customerId: string;
  adminId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  Customer?: User;
  Admin?: User;
}
```

### Message Model
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  read: boolean;
  Sender?: User;
  Receiver?: User;
}
```

## API Endpoints

### Customer Endpoints
- `POST /api/chats/get-or-create` - Create or get chat with admin
- `GET /api/chats/customer/chats` - Get all customer chats
- `GET /api/chats/:chatId/messages` - Get messages for a chat
- `GET /api/chats/admins` - Get available admin users

### Admin Endpoints
- `GET /api/chats/admin/chats` - Get all admin chats
- `GET /api/chats/:chatId/messages` - Get messages for a chat

## Socket.io Events

### Client to Server
- `joinChat(chatId)` - Join a chat room
- `leaveChat(chatId)` - Leave a chat room
- `sendMessage({chatId, content, imageUrl?})` - Send a message
- `typing({chatId, userId})` - Typing indicator
- `stopTyping({chatId, userId})` - Stop typing indicator
- `markAsRead({chatId})` - Mark messages as read

### Server to Client
- `receiveMessage(message)` - New message received
- `newMessageNotification({chatId, message, sender})` - Notification for new message
- `typing({chatId, userId, username})` - Someone is typing
- `stopTyping({chatId, userId, username})` - Someone stopped typing
- `messagesRead({chatId, userId})` - Messages marked as read

## Frontend Components

### CustomerChat Component (Nike Frontend)
- **Location**: `src/components/CustomerChat.tsx`
- **Features**: 
  - Floating chat button
  - Real-time messaging
  - Typing indicators
  - Message history
  - Auto-connects to first available admin

### AdminChat Component (Admin Panel)
- **Location**: `components/AdminChat.tsx`
- **Features**:
  - Floating chat widget
  - Chat list sidebar
  - Real-time messaging
  - Typing indicators
  - Customer management
  - Unread message counts

## How to Start

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

## Testing the System

### 1. Test Backend
```bash
node test-new-chat-system.js
```

### 2. Manual Testing
1. Open http://localhost:5173 (Customer)
2. Open http://localhost:3000 (Admin)
3. Login to both applications
4. Click the chat button in customer app
5. Send messages between customer and admin
6. Verify real-time updates work

## Key Features

### Real-time Communication
- Instant message delivery via Socket.io
- Typing indicators
- Message read receipts
- Online user tracking

### User Experience
- Clean, minimal UI
- Floating chat widgets
- Responsive design
- Toast notifications

### Security
- JWT authentication required
- User access verification
- Chat room isolation
- Input validation

## File Structure

### Backend
```
src/
├── controllers/chatController.ts
├── routes/chatRoute.ts
├── database/models/
│   ├── chatModel.ts
│   └── messageModel.ts
└── server.ts (Socket.io events)
```

### Frontend
```
nike-frontend/src/components/CustomerChat.tsx
admin-panel/components/AdminChat.tsx
```

## Configuration

### Ports
- **Backend**: 5000 (configurable via PORT env var)
- **Nike Frontend**: 5173
- **Admin Panel**: 3000

### Environment Variables
- `PORT`: Backend port (default: 5000)
- `JWT_SECRETE_KEY`: JWT secret for authentication
- `DATABASE_URL`: Database connection string

## Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if backend is running on port 5000
   - Verify CORS configuration
   - Check browser console for errors

2. **Messages Not Appearing**
   - Verify user is logged in
   - Check Socket.io event listeners
   - Verify chat room joining

3. **Authentication Errors**
   - Ensure JWT token is valid
   - Check token in localStorage
   - Verify user role permissions

### Debug Commands

```javascript
// Check socket connection
console.log('Socket connected:', socket?.connected);

// Check authentication
console.log('Token:', localStorage.getItem('tokenauth'));

// Check user data
console.log('User:', user);
```

## Development Notes

- All previous chat code has been completely removed
- New system is built from scratch for simplicity
- Uses modern React hooks and functional components
- Implements proper TypeScript interfaces
- Follows clean architecture principles
- Minimal dependencies and complexity

## Next Steps

1. Test the system thoroughly
2. Add any additional features as needed
3. Deploy to production
4. Monitor performance and usage

The new chat system is now ready for use! 🎉
