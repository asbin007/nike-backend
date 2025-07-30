# Khalti Payment Integration Guide

## Frontend Integration

### 1. Admin Order Status Management

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Admin connected to WebSocket');
    });

    // Listen for order status updates
    newSocket.on('orderStatusUpdated', (data) => {
      console.log('Order status updated:', data);
      // Update orders list in real-time
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId 
            ? { ...order, orderStatus: data.status }
            : order
        )
      );
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const changeOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/admin/change-status/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const result = await response.json();
      
      if (result.message === 'Order status updated successfully') {
        alert('Order status updated successfully!');
        // WebSocket will handle real-time update
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div>
      <h2>Order Management</h2>
      {orders.map(order => (
        <div key={order.id}>
          <p>Order ID: {order.id}</p>
          <p>Status: {order.orderStatus}</p>
          <select 
            value={order.orderStatus}
            onChange={(e) => changeOrderStatus(order.id, e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="preparation">Preparation</option>
            <option value="ontheway">On the Way</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      ))}
    </div>
  );
};
```

### 2. Customer Order Tracking

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const CustomerOrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket for chart
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Customer connected to WebSocket');
    });

    // Listen for order status updates
    newSocket.on('orderStatusUpdated', (data) => {
      console.log('Order status updated:', data);
      // Update orders list in real-time
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId 
            ? { ...order, orderStatus: data.status }
            : order
        )
      );
      
      // Show notification
      alert(`Order ${data.orderId} status updated to ${data.status}`);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          <p>Order ID: {order.id}</p>
          <p>Status: {order.orderStatus}</p>
          <p>Last Updated: {order.updatedAt}</p>
        </div>
      ))}
    </div>
  );
};
```

### 3. Create Order with Khalti Payment

```javascript
// Create order with Khalti payment
const createOrderWithKhalti = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...orderData,
        paymentMethod: 'khalti'
      })
    });

    const result = await response.json();
    
    if (result.url) {
      // Redirect to Khalti payment page
      window.location.href = result.url;
      
      // Store pidx for verification
      localStorage.setItem('khalti_pidx', result.pidx);
    }
  } catch (error) {
    console.error('Order creation error:', error);
  }
};
```

### 2. Payment Verification After Redirect

```javascript
// Check if user returned from Khalti payment
const checkPaymentStatus = async () => {
  const pidx = localStorage.getItem('khalti_pidx');
  
  if (pidx) {
    try {
      const response = await fetch('/api/orders/khalti/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pidx })
      });

      const result = await response.json();
      
      if (result.paymentStatus === 'paid') {
        // Payment successful
        alert('Payment successful! Your order is being prepared.');
        localStorage.removeItem('khalti_pidx');
        
        // Refresh order list or redirect
        window.location.href = '/orders';
      } else {
        // Payment failed or pending
        alert('Payment verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  }
};

// Call this function when page loads
document.addEventListener('DOMContentLoaded', checkPaymentStatus);
```

### 3. React Component with WebSocket

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const KhaltiPayment = ({ orderData }) => {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    // Listen for order status updates
    newSocket.on('orderStatusUpdated', (data) => {
      console.log('Order status updated:', data);
      if (data.status === 'preparation') {
        alert('Order is being prepared!');
        // Update UI or redirect
      }
    });

    // Listen for payment status updates
    newSocket.on('paymentStatusUpdated', (data) => {
      console.log('Payment status updated:', data);
      if (data.status === 'paid') {
        alert('Payment completed successfully!');
        localStorage.removeItem('khalti_pidx');
        // Update UI or redirect
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleKhaltiPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...orderData,
          paymentMethod: 'khalti'
        })
      });

      const result = await response.json();
      
      if (result.url) {
        // Store pidx
        localStorage.setItem('khalti_pidx', result.pidx);
        
        // Redirect to Khalti
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    const pidx = localStorage.getItem('khalti_pidx');
    
    if (pidx) {
      try {
        const response = await fetch('/api/orders/khalti/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ pidx })
        });

        const result = await response.json();
        
        if (result.paymentStatus === 'paid') {
          alert('Payment successful!');
          localStorage.removeItem('khalti_pidx');
          // Update UI or redirect
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    }
  };

  useEffect(() => {
    // Check payment status when component mounts
    verifyPayment();
  }, []);

  return (
    <div>
      <button 
        onClick={handleKhaltiPayment}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay with Khalti'}
      </button>
    </div>
  );
};
```

### 4. Payment Status Check

```javascript
// Function to check payment status periodically
const checkPaymentStatusPeriodically = (pidx, maxAttempts = 10) => {
  let attempts = 0;
  
  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      console.log('Max verification attempts reached');
      return;
    }

    try {
      const response = await fetch('/api/orders/khalti/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pidx })
      });

      const result = await response.json();
      
      if (result.paymentStatus === 'paid') {
        console.log('Payment verified successfully!');
        return;
      } else {
        // Try again after 2 seconds
        attempts++;
        setTimeout(checkStatus, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      attempts++;
      setTimeout(checkStatus, 2000);
    }
  };

  checkStatus();
};
```

## Backend API Endpoints

### 1. Create Order
```
POST /api/orders
```

**Response:**
```json
{
  "message": "order created successfully",
  "data": { ... },
  "url": "https://khalti.com/payment/...",
  "pidx": "transaction_id",
  "instructions": "After payment completion, call /api/orders/khalti/verify with pidx to update payment status"
}
```

### 2. Verify Payment
```
POST /api/orders/khalti/verify
```

**Request:**
```json
{
  "pidx": "transaction_id"
}
```

**Response:**
```json
{
  "message": "Payment verified successfully!",
  "paymentStatus": "paid",
  "orderStatus": "preparation",
  "pidx": "transaction_id",
  "amount": 5000,
  "orderId": "order_id"
}
```

## Payment Flow

### 1. Order Creation
1. Frontend sends order data with `paymentMethod: 'khalti'`
2. Backend creates order and generates Khalti payment URL
3. Frontend redirects user to Khalti payment page

### 2. Payment Processing
1. User completes payment on Khalti
2. Khalti redirects back to your website
3. Frontend calls verification endpoint

### 3. Payment Verification
1. Backend verifies payment with Khalti API
2. Updates payment status to 'paid'
3. Updates order status to 'preparation'
4. Returns verification result to frontend

## Error Handling

### Common Issues
1. **Payment not verified** - Call verification endpoint manually
2. **Network errors** - Retry verification after few seconds
3. **Invalid pidx** - Check if pidx is stored correctly

### Debug Steps
1. Check browser console for errors
2. Verify pidx is stored in localStorage
3. Check network tab for API calls
4. Verify token is valid

## Testing

### Test Payment Flow
1. Create order with Khalti payment
2. Complete payment on Khalti test environment
3. Verify payment status is updated
4. Check order status is updated

### Test Data
```json
{
  "phoneNumber": "9841234567",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "city": "Kathmandu",
  "addressLine": "Test Address",
  "state": "Bagmati",
  "zipcode": "44600",
  "street": "Test Street",
  "totalPrice": 100,
  "paymentMethod": "khalti",
  "shoes": [
    {
      "productId": "test-product-id",
      "productQty": 1
    }
  ]
}
``` 
