# Chat System Documentation

## Overview
Yo chat system le admin ra customer bich ma real-time communication provide garne cha. WebSocket use garera instant messaging, typing indicators, ra message notifications support garne cha.

## Features
- Real-time messaging between admin and customer
- Typing indicators
- Message read status
- Unread message count
- Chat statistics for admin dashboard
- Message notifications
- Multiple admin support

## API Endpoints

### 1. Get or Create Chat
```
POST /api/chats/get-or-create
```
**Body:**
```json
{
  "adminId": "admin-uuid"
}
```
**Response:**
```json
{
  "message": "Chat retrieved successfully",
  "chat": {
    "id": "chat-uuid",
    "adminId": "admin-uuid",
    "customerId": "customer-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get Chat Messages
```
GET /api/chats/:chatId/messages
```
**Response:**
```json
{
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": "message-uuid",
      "content": "Hello!",
      "read": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "Sender": {
        "id": "user-uuid",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "customer"
      },
      "Receiver": {
        "id": "admin-uuid",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin"
      }
    }
  ]
}
```

### 3. Send Message
```
POST /api/chats/send-message
```
**Body:**
```json
{
  "chatId": "chat-uuid",
  "content": "Hello, I need help with my order"
}
```
**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "message-uuid",
    "content": "Hello, I need help with my order",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "Sender": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "Receiver": {
      "id": "admin-uuid",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### 4. Get All Chats
```
GET /api/chats/all
```
**Response:**
```json
{
  "message": "Chats fetched successfully",
  "data": [
    {
      "id": "chat-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "Customer": {
        "id": "customer-uuid",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "customer"
      },
      "Messages": [
        {
          "content": "Latest message",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "read": false
        }
      ]
    }
  ]
}
```

### 5. Get Unread Count
```
GET /api/chats/unread/count
```
**Response:**
```json
{
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 5
  }
}
```

### 6. Get Admin Users
```
GET /api/chats/admins
```
**Response:**
```json
{
  "message": "Admin users retrieved successfully",
  "data": [
    {
      "id": "admin-uuid",
      "username": "admin1",
      "email": "admin1@example.com"
    }
  ]
}
```

### 7. Get Chat Statistics (Admin Only)
```
GET /api/chats/stats
```
**Response:**
```json
{
  "message": "Chat statistics retrieved successfully",
  "data": {
    "totalChats": 10,
    "unreadMessages": 5,
    "totalMessages": 150
  }
}
```

### 8. Mark Messages as Read
```
POST /api/chats/:chatId/mark-read
```
**Response:**
```json
{
  "message": "Messages marked as read."
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Chat Room
```javascript
socket.emit('joinChat', 'chat-uuid');
```

### Leave Chat Room
```javascript
socket.emit('leaveChat', 'chat-uuid');
```

### Send Message
```javascript
socket.emit('sendMessage', {
  chatId: 'chat-uuid',
  content: 'Hello!'
});
```

### Typing Indicators
```javascript
// Start typing
socket.emit('typing', {
  chatId: 'chat-uuid',
  userId: 'user-uuid'
});

// Stop typing
socket.emit('stopTyping', {
  chatId: 'chat-uuid',
  userId: 'user-uuid'
});
```

### Mark Messages as Read
```javascript
socket.emit('markAsRead', {
  chatId: 'chat-uuid'
});
```

## WebSocket Listeners

### Receive Message
```javascript
socket.on('receiveMessage', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});
```

### Typing Indicators
```javascript
socket.on('typing', ({ chatId, userId }) => {
  console.log(`${userId} is typing in chat ${chatId}`);
  // Show typing indicator
});

socket.on('stopTyping', ({ chatId, userId }) => {
  console.log(`${userId} stopped typing in chat ${chatId}`);
  // Hide typing indicator
});
```

### Message Notifications
```javascript
socket.on('newMessageNotification', ({ chatId, message, sender }) => {
  console.log(`New message from ${sender} in chat ${chatId}`);
  // Show notification
});
```

### Messages Read
```javascript
socket.on('messagesRead', ({ chatId, userId }) => {
  console.log(`Messages read by ${userId} in chat ${chatId}`);
  // Update read status in UI
});
```

## Frontend Integration Examples

### React Chat Component
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ chatId, token }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('joinChat', chatId);
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('typing', ({ userId }) => {
      setIsTyping(true);
    });

    newSocket.on('stopTyping', ({ userId }) => {
      setIsTyping(false);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [chatId, token]);

  const sendMessage = (content) => {
    socket.emit('sendMessage', { chatId, content });
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
};
```

### Admin Dashboard Integration
```jsx
const AdminDashboard = () => {
  const [chats, setChats] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Fetch chats and stats
    fetchChats();
    fetchStats();
  }, []);

  const fetchChats = async () => {
    const response = await fetch('/api/chats/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setChats(data.data);
  };

  const fetchStats = async () => {
    const response = await fetch('/api/chats/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setStats(data.data);
  };

  return (
    <div>
      <div>Total Chats: {stats.totalChats}</div>
      <div>Unread Messages: {stats.unreadMessages}</div>
      {/* Chat list */}
    </div>
  );
};
```

## Security Features
- JWT token authentication for WebSocket connections
- User access verification for chat rooms
- Role-based access control (admin/customer)
- Message validation and sanitization

## Error Handling
- Invalid token handling
- Access denied for unauthorized users
- Network error handling
- Message validation errors

## Database Schema

### Chat Model
```typescript
{
  id: UUID (Primary Key)
  adminId: UUID (Foreign Key to User)
  customerId: UUID (Foreign Key to User)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Message Model
```typescript
{
  id: UUID (Primary Key)
  chatId: UUID (Foreign Key to Chat)
  senderId: UUID (Foreign Key to User)
  receiverId: UUID (Foreign Key to User)
  content: Text
  read: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Environment Variables
```env
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
PORT=3000
``` 