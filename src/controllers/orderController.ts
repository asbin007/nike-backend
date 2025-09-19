import { OrderStatus } from "./../services/types.js";
import { Response, Request } from "express";
import Payment from "../database/models/paymentModel.js";
import { PaymentMethod, PaymentStatus } from "../services/types.js";
import Order from "../database/models/orderModel.js";
import OrderDetails from "../database/models/orderDetaills.js";
import Cart from "../database/models/cartModel.js";
import axios from "axios";
import Shoe from "../database/models/productModel.js";
import Category from "../database/models/categoryModel.js";



interface IProduct {
  productId: string;
  productQty: number;
}

class OrderWithPaymentId extends Order{
  declare paymentId: string;
}

class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const {
      phoneNumber,
      firstName,
      lastName,
      email,
      city,
      addressLine,
      state,
      zipcode,
      totalPrice,
      paymentMethod,
      street,
    } = req.body;
    
    // Handle different possible field names for totalPrice
    const finalTotalPrice = totalPrice || req.body.total_price || req.body.totalPrice || req.body.amount;
    const shoes: IProduct[] = req.body.shoes || req.body.Shoe; // Accept both shoes and Shoe

    // Debug logging
    console.log('Request body:', req.body);
    console.log('Shoes data:', shoes);

    if (
      !phoneNumber ||
      !city ||
      !addressLine ||
      !state ||
      !zipcode ||
      !finalTotalPrice ||
      !shoes || shoes.length == 0 ||
      !firstName ||
      !lastName ||
      !email
    ) {
      res.status(400).json({
        message: "Please provide all required fields: phoneNumber, city, addressLine, state, zipcode, totalPrice, shoes, firstName, lastName, email",
        missingFields: {
          phoneNumber: !phoneNumber,
          city: !city,
          addressLine: !addressLine,
          state: !state,
          zipcode: !zipcode,
          totalPrice: !finalTotalPrice,
          shoes: !shoes || shoes.length === 0,
          firstName: !firstName,
          lastName: !lastName,
          email: !email
        },
        receivedData: {
          phoneNumber,
          city,
          addressLine,
          state,
          zipcode,
          totalPrice: finalTotalPrice,
          shoes: shoes ? shoes.length : 'undefined',
          firstName,
          lastName,
          email
        }
      });
      return;
    }

    // for payment
    let data;
    const paymentData = await Payment.create({
      paymentMethod: paymentMethod,
    });

    const orderData = await Order.create({
      userId: userId, // Fix: Add userId
      phoneNumber,
      firstName,
      lastName,
      email,
      city,
      addressLine,
      state,
      street,
      zipcode,
      totalPrice: finalTotalPrice,
      paymentId: paymentData.id, // Fix: Use paymentId instead of paymentMethod
    });

    // for orderDetaills
    shoes.forEach(async function (product: IProduct) {
      data = await OrderDetails.create({
        quantity: product.productQty,
        productId: product.productId,
        orderId: orderData.id,
      });

      await Cart.destroy({
        where: {
          productId: product.productId,
          userId: userId,
        },
      });
    });

    // for payment
    if (paymentMethod === PaymentMethod.Khalti) {
      const data = {
        return_url: (process.env.FRONTEND_URL || "https://nike-frontend.vercel.app") + "/payment-success",
        website_url: process.env.FRONTEND_URL || "https://nike-frontend.vercel.app/",
        amount: finalTotalPrice * 100,
        purchase_order_id: orderData.id,
        purchase_order_name: "order_" + orderData.id,
      };
      const response = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/initiate/",
        data,
        {
          headers: {
            Authorization: "Key 5d818e0244bd414f99ad73e584d04e11",
          },
        }
      );

      const khaltiResponse = response.data;

      paymentData.pidx = khaltiResponse.pidx;
      await paymentData.save();
      
      // Immediately verify payment status
      try {
        const verifyResponse = await axios.post(
          "https://a.khalti.com/api/v2/epayment/lookup/",
          {
            pidx: khaltiResponse.pidx,
          },
          {
            headers: {
              Authorization: "Key b71142e3f4fd4da8acccd01c8975be38",
            },
          }
        );

        const verifyData = verifyResponse.data;
        console.log('Immediate verification response:', verifyData);

        if (verifyData.status === "Completed") {
          // Update payment status to paid
          await Payment.update(
            { paymentStatus: PaymentStatus.Paid },
            {
              where: {
                pidx: khaltiResponse.pidx,
              },
            }
          );

          // Find order by payment ID and update status
          const order = await Order.findOne({
            where: { paymentId: paymentData.id }
          });

          if (order) {
            await Order.update(
              { orderStatus: OrderStatus.Preparation },
              {
                where: {
                  id: order.id,
                },
              }
            );
            console.log('Payment and order status updated immediately');

            // Emit websocket event for real-time updates
            const io = (global as any).io;
            if (io) {
              // Emit to specific user
              io.emit('orderStatusUpdated', {
                orderId: order.id,
                status: OrderStatus.Preparation,
                message: 'Order status updated to preparation'
              });

              // Emit payment status update
              io.emit('paymentStatusUpdated', {
                paymentId: paymentData.id,
                status: PaymentStatus.Paid,
                message: 'Payment completed successfully'
              });

              console.log('Websocket events emitted for order and payment updates');
            }
          }
        }
      } catch (error) {
        console.error('Immediate verification error:', error);
        // Continue with order creation even if verification fails
      }

      // Return appropriate response based on payment method
      if (paymentMethod === PaymentMethod.Khalti) {
        res.status(201).json({
          message: "order created successfully",
          data,
          url: khaltiResponse.payment_url,
          pidx: khaltiResponse.pidx,
          instructions: "After payment completion, call /api/orders/khalti/verify with pidx to update payment status"
        });
      } else {
        // For COD and other payment methods
        res.status(201).json({
          message: "order created successfully",
          data,
          // No URL for COD payments - frontend will redirect to success page
        });
      }
    } else if (paymentMethod == PaymentMethod.Esewa) {
      // Esewa payment flow will be implemented later
    } else {
      // For COD payments
      res.status(201).json({
        message: "Order created successfully",
        data,
        // No URL for COD payments - frontend will redirect to success page
      });
    }
  }
  async verifyTransaction(req: Request, res: Response): Promise<void> {
    const { pidx } = req.body;
    if (!pidx) {
      res.status(400).json({
        message: "Please provide pidx",
      });
      return;
    }

    try {
      // Verify with Khalti API
    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      {
        pidx: pidx,
      },
      {
        headers: {
          Authorization: "Key b71142e3f4fd4da8acccd01c8975be38",
        },
      }
    );

    const data = response.data;
      console.log('Khalti verification response:', data);

    if (data.status === "Completed") {
        // Find payment by pidx
        const payment = await Payment.findOne({
          where: { pidx: pidx }
        });

        if (!payment) {
          res.status(404).json({
            message: "Payment not found",
          });
          return;
        }

        // Update payment status to paid
      await Payment.update(
        { paymentStatus: PaymentStatus.Paid },
        {
          where: {
            pidx: pidx,
          },
        }
      );

        // Find order by payment ID
        const order = await Order.findOne({
          where: { paymentId: payment.id }
        });

        if (order) {
          // Update order status to preparation
          await Order.update(
            { orderStatus: OrderStatus.Preparation },
            {
              where: {
                id: order.id,
              },
            }
          );
        }

        // Emit websocket event for real-time updates
        const io = (global as any).io;
        if (io && order) {
          io.emit('orderStatusUpdated', {
            orderId: order.id,
            status: OrderStatus.Preparation,
            message: 'Order status updated to preparation'
          });

          io.emit('paymentStatusUpdated', {
            paymentId: payment.id,
            status: PaymentStatus.Paid,
            message: 'Payment verified successfully'
          });

          console.log('Websocket events emitted for manual verification');
        }

        res.status(200).json({
          message: "Payment verified successfully!",
          paymentStatus: PaymentStatus.Paid,
          orderStatus: OrderStatus.Preparation,
          pidx: pidx,
          amount: data.amount,
          orderId: order?.id
        });
      } else if (data.status === "Failed" || data.status === "Cancelled") {
        // Update payment status to unpaid
        await Payment.update(
          { paymentStatus: PaymentStatus.Unpaid },
          {
            where: {
              pidx: pidx,
            },
          }
        );

      res.status(200).json({
          message: "Payment failed or cancelled",
          paymentStatus: PaymentStatus.Unpaid,
          status: data.status,
          pidx: pidx
      });
    } else {
      res.status(200).json({
          message: "Payment status: " + data.status,
          status: data.status,
          pidx: pidx
        });
      }
    } catch (error) {
      console.error('Error verifying Khalti payment:', error);
      res.status(500).json({
        message: "Error verifying payment",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }



  async fetchMyOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { pidx } = req.body;
    const orders = await Order.findAll({
      where: {
        userId,
      },
      attributes: ["totalPrice", "id", "orderStatus"],
      include: {
        model: Payment,
        attributes: [ 'id', "paymentMethod", "paymentStatus"],
      },
    });
    console.log(orders,"order")
    if (orders.length > 0) {
      res.status(201).json({
        message: "Order fetched successfully",
        data: orders,
        pidx: pidx,
      });
    } else {
      res.status(404).json({
        message: "No order found",
        data: [],
      });
    }
  }
  async fetchMyOrderDetail(req: Request, res: Response): Promise<void> {
    const orderId = req.params.id;
    const userId = req.user?.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      res.status(400).json({
        message: "Invalid order ID format",
        error: "Order ID must be a valid UUID"
      });
      return;
    }
    const orders = await OrderDetails.findAll({
      where: {
        orderId,
      },
      include: [
        {
          model: Order,
          include: [
            {
              model: Payment,
              attributes: ["id", "paymentMethod", "paymentStatus"],
            },
          ],
          attributes: [
            "id",
            "orderStatus",
            "addressLine",
            "city",
            "state",
            "totalPrice",
            "phoneNumber",
            "firstName",
            "lastName",
            "userId",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: Shoe,
          include: [
            {
              model: Category,
            },
          ],
          attributes: ["images", "name", "price"],
        },
      ],
    });
    if (orders.length > 0) {
      res.status(200).json({
        message: "Order details fetched successfully",
        data: orders,
      });
    } else {
      res.status(404).json({
        message: "No order found",
        data: [],
      });
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const orderId = req.params.id;
    const [order] = await Order.findAll({
      where: {
        userId,
        id: orderId,
      },
    });
    if (!order) {
      res.status(400).json({
        message: "No order with that id",
      });
      return;
    }
    //check other status

    if (
      order.orderStatus === OrderStatus.Ontheway ||
      order.orderStatus === OrderStatus.Preparation
    ) {
      res.status(403).json({
        message:
          "You cannot cancelled order, it is on the way or preparation mode",
      });
      return;
    }
    await Order.update(
      { orderStatus: OrderStatus.Cancelled },
      {
        where: {
          id: orderId,
        },
      }
    );
    res.status(201).json({
      message: "Order cancelled successfully",
    });
  }

  async changeOrderStatus(req: Request, res: Response): Promise<void> {
    const orderId = req.params.id;
    const { orderStatus } = req.body;
    if (!orderId || !orderStatus) {
      res.status(400).json({
        message: "Please provide orderId and orderStatus",
      });
      return;
    }

    try {
      // Find the order with payment information
      const order = await Order.findByPk(orderId, {
        include: [{
          model: Payment,
          attributes: ['id', 'paymentStatus', 'paymentMethod']
        }]
      });
      
      if (!order) {
        res.status(404).json({
          message: "Order not found",
        });
        return;
      }

      // Business Logic Validation
      const currentStatus = order.orderStatus;
      const paymentStatus = order.Payment?.paymentStatus;

      // Rule 1: Cannot deliver without payment
      if (orderStatus === OrderStatus.Delivered && paymentStatus !== 'paid') {
        res.status(400).json({
          message: "Cannot deliver order without payment. Payment status must be 'paid'.",
          currentPaymentStatus: paymentStatus,
          requiredPaymentStatus: 'paid'
        });
        return;
      }

      // Rule 2: Cannot move to preparation without payment (for non-COD orders)
      if (orderStatus === OrderStatus.Preparation && 
          order.Payment?.paymentMethod !== 'cod' && 
          paymentStatus !== 'paid') {
        res.status(400).json({
          message: "Cannot prepare order without payment. Payment status must be 'paid' for non-COD orders.",
          currentPaymentStatus: paymentStatus,
          paymentMethod: order.Payment?.paymentMethod
        });
        return;
      }

      // Rule 3: Status progression validation
      const validTransitions: { [key: string]: string[] } = {
        [OrderStatus.Pending]: [OrderStatus.Preparation, OrderStatus.Cancelled],
        [OrderStatus.Preparation]: [OrderStatus.Ontheway, OrderStatus.Cancelled],
        [OrderStatus.Ontheway]: [OrderStatus.Delivered],
        [OrderStatus.Delivered]: [], // Final state
        [OrderStatus.Cancelled]: [] // Final state
      };

      // Special case: Allow admin to skip steps for urgent orders (with proper payment)
      if (currentStatus === OrderStatus.Pending && 
          orderStatus === OrderStatus.Delivered && 
          paymentStatus === 'paid') {
        console.log('Admin skipping status progression for urgent delivery');
        // Allow this transition but log it
      } else if (!validTransitions[currentStatus]?.includes(orderStatus)) {
        res.status(400).json({
          message: `Invalid status transition from ${currentStatus} to ${orderStatus}`,
          currentStatus,
          newStatus: orderStatus,
          validTransitions: validTransitions[currentStatus] || []
        });
        return;
      }

      // Update order status
      await Order.update(
        { orderStatus: orderStatus },
        {
          where: {
            id: orderId,
          },
        }
      );

      // Emit websocket event for real-time updates
      const io = (global as any).io;
      if (io) {
        io.emit('orderStatusUpdated', {
          orderId: orderId,
          status: orderStatus,
          previousStatus: currentStatus,
          paymentStatus: paymentStatus,
          message: `Order status updated from ${currentStatus} to ${orderStatus}`,
          updatedBy: req.user?.id
        });

        console.log('Websocket event emitted for order status change');
      }

      res.status(200).json({
        message: "Order status updated successfully",
        orderId: orderId,
        previousStatus: currentStatus,
        newStatus: orderStatus,
        paymentStatus: paymentStatus
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        message: "Error updating order status",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async changePaymentStatus(req: Request, res: Response): Promise<void> {
    const paymentId = req.params.id; // Get paymentId from URL parameter
    const { status } = req.body;
    
    if (!paymentId || !status) {
      res.status(400).json({
        message: "Please provide paymentId and status",
      });
      return;
    }

    try {
      // Find the payment
      const payment = await Payment.findByPk(paymentId);
      
      if (!payment) {
        res.status(404).json({
          message: "Payment not found",
        });
        return;
      }

      // Find the associated order
      const order = await Order.findOne({
        where: { paymentId: paymentId }
      });
      const currentPaymentStatus = payment.paymentStatus;

      // Business Logic Validation for Payment Status
      
      // Rule 1: Cannot change from 'paid' to 'unpaid' if order is already delivered
      if (currentPaymentStatus === 'paid' && status === 'unpaid' && order?.orderStatus === OrderStatus.Delivered) {
        res.status(400).json({
          message: "Cannot change payment status from 'paid' to 'unpaid' for delivered orders",
          currentPaymentStatus,
          newStatus: status,
          orderStatus: order?.orderStatus
        });
        return;
      }

      // Rule 2: Cannot change from 'paid' to 'unpaid' if order is on the way
      if (currentPaymentStatus === 'paid' && status === 'unpaid' && order?.orderStatus === OrderStatus.Ontheway) {
        res.status(400).json({
          message: "Cannot change payment status from 'paid' to 'unpaid' for orders that are on the way",
          currentPaymentStatus,
          newStatus: status,
          orderStatus: order?.orderStatus
        });
        return;
      }

      // Rule 3: Khalti payments cannot be manually changed to 'unpaid' once verified
      if (payment.paymentMethod === PaymentMethod.Khalti && currentPaymentStatus === 'paid' && status === 'unpaid') {
        res.status(400).json({
          message: "Cannot change Khalti payment status from 'paid' to 'unpaid'. Khalti payments are automatically verified and cannot be manually reversed.",
          paymentMethod: payment.paymentMethod,
          currentPaymentStatus,
          newStatus: status,
          reason: "Khalti payments are automatically verified and cannot be manually reversed"
        });
        return;
      }

      // Rule 4: COD payments should only be marked as 'paid' when order is delivered or confirmed by admin
      if (payment.paymentMethod === PaymentMethod.COD && status === 'paid' && order?.orderStatus === OrderStatus.Pending) {
        res.status(400).json({
          message: "COD payments should only be marked as 'paid' when order is delivered or confirmed by admin. Please update order status first.",
          paymentMethod: payment.paymentMethod,
          currentOrderStatus: order?.orderStatus,
          newPaymentStatus: status,
          suggestion: "Update order status to 'delivered' or 'preparation' before marking COD as paid"
        });
        return;
      }

      // Rule 5: Cannot change payment status if order is cancelled
      if (order?.orderStatus === OrderStatus.Cancelled) {
        res.status(400).json({
          message: "Cannot change payment status for cancelled orders",
          paymentMethod: payment.paymentMethod,
          currentPaymentStatus,
          newStatus: status,
          orderStatus: order?.orderStatus
        });
        return;
      }

      // Rule 3: If payment is marked as 'paid', automatically move order to preparation (if it's pending)
      let orderStatusUpdate = null;
      if (status === 'paid' && order?.orderStatus === OrderStatus.Pending) {
        orderStatusUpdate = OrderStatus.Preparation;
      }

      // Update payment status
      await Payment.update(
        { paymentStatus: status },
        {
          where: {
            id: paymentId,
          },
        }
      );

      // Update order status if needed
      if (orderStatusUpdate && order) {
        await Order.update(
          { orderStatus: orderStatusUpdate },
          { where: { id: order.id } }
        );
      }

      // Emit websocket event for real-time updates
      const io = (global as any).io;
      if (io) {
        io.emit('paymentStatusUpdated', {
          paymentId: paymentId,
          orderId: order?.id,
          status: status,
          previousStatus: currentPaymentStatus,
          orderStatus: orderStatusUpdate || order?.orderStatus,
          message: `Payment status updated from ${currentPaymentStatus} to ${status}`,
          updatedBy: req.user?.id
        });

        // If order status was also updated, emit order status update
        if (orderStatusUpdate && order) {
          io.emit('orderStatusUpdated', {
            orderId: order.id,
            status: orderStatusUpdate,
            previousStatus: order.orderStatus,
            paymentStatus: status,
            message: `Order automatically moved to preparation after payment confirmation`,
            updatedBy: req.user?.id
          });
        }

        console.log('Websocket event emitted for payment status change');
      }

      res.status(200).json({
        message: "Payment status updated successfully",
        paymentId: paymentId,
        orderId: order?.id,
        previousStatus: currentPaymentStatus,
        newStatus: status,
        orderStatusUpdated: orderStatusUpdate ? {
          previousStatus: order?.orderStatus,
          newStatus: orderStatusUpdate
        } : null
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({
        message: "Error updating payment status",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a single order (Admin only)
   * - Validates order exists
   * - Prevents deletion of delivered orders
   * - Deletes order details, order, and payment in proper sequence
   * - Emits websocket event for real-time updates
   */
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.id;
      
      if (!orderId) {
        res.status(400).json({
          message: "Order ID is required"
        });
        return;
      }

      // Find the order with payment information
      const order: OrderWithPaymentId = await Order.findByPk(orderId) as OrderWithPaymentId;
      
      if (!order) {
        res.status(404).json({
          message: "Order not found with the provided ID"
        });
        return;
      }

      const paymentId = order.paymentId;

      // Check if order can be deleted (business logic)
      if (order.orderStatus === OrderStatus.Delivered) {
        res.status(400).json({
          message: "Cannot delete delivered orders",
          orderStatus: order.orderStatus
        });
        return;
      }

      // Delete in proper order to maintain referential integrity
      // 1. Delete order details first
      await OrderDetails.destroy({
        where: {
          orderId: orderId
        }
      });

      // 2. Delete the order
      await Order.destroy({
        where: {
          id: orderId
        }
      });

      // 3. Delete the payment
      await Payment.destroy({
        where: {
          id: paymentId
        }
      });

      // Emit websocket event for real-time updates
      const io = (global as any).io;
      if (io) {
        io.emit('orderDeleted', {
          orderId: orderId,
          message: 'Order deleted by admin',
          deletedBy: req.user?.id
        });
        console.log('Websocket event emitted for order deletion');
      }

      res.status(200).json({
        message: "Order deleted successfully",
        orderId: orderId,
        deletedOrderDetails: {
          orderStatus: order.orderStatus,
          totalPrice: order.totalPrice,
          customerName: `${order.firstName} ${order.lastName}`
        }
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        message: "Error deleting order",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Khalti Webhook Handler
  async khaltiWebhook(req: Request, res: Response): Promise<void> {
    const { pidx, status, amount, purchase_order_id, signature } = req.body;
    
    console.log('Khalti webhook received:', { pidx, status, amount, purchase_order_id, signature });

    if (!pidx || !status) {
      res.status(400).json({
        message: "Missing required parameters: pidx, status"
      });
      return;
    }

    // Verify Khalti signature (if provided)
    if (signature) {
      // Signature verification will be implemented later
      // const expectedSignature = crypto
      //   .createHmac('sha256', process.env.KHALTI_WEBHOOK_SECRET || '')
      //   .update(JSON.stringify(req.body))
      //   .digest('hex');
      
      // if (signature !== expectedSignature) {
      //   console.log('Invalid signature received');
      //   res.status(401).json({
      //     message: "Invalid signature"
      //   });
      //   return;
      // }
    }

    try {
      // Find payment by pidx
      const payment = await Payment.findOne({
        where: { pidx: pidx }
      });

      if (!payment) {
        console.log('Payment not found for pidx:', pidx);
        res.status(404).json({
          message: "Payment not found"
        });
        return;
      }

      // Find associated order
      let order = await Order.findOne({
        where: { paymentId: payment.id }
      });

      // Fallback: If order not found, try with orderId from webhook
      if (!order && req.body.orderId) {
        console.log('Order not found by paymentId, trying direct update by orderId from webhook:', req.body.orderId);
        // Directly update order status if orderId is present
        const [affectedRows] = await Order.update(
          { orderStatus: OrderStatus.Preparation },
          { where: { id: req.body.orderId } }
        );
        if (affectedRows > 0) {
          // Success, emit socket event
          const io = (global as any).io;
          if (io) {
            io.emit('orderStatusUpdated', {
              orderId: req.body.orderId,
              status: OrderStatus.Preparation,
              message: 'Order status updated via webhook (direct fallback)'
            });
          }
          res.status(200).json({
            message: "Order status updated via fallback",
            orderId: req.body.orderId
          });
          return;
        } else {
          console.log('Order not found for payment:', payment.id, 'webhook orderId:', req.body.orderId);
          res.status(404).json({
            message: "Order not found"
          });
          return;
        }
      }

      console.log('Order found:', order ? { id: order.id } : 'null');

      if (!order) {
        console.log('Order not found for payment:', payment.id, 'webhook orderId:', req.body.orderId);
        res.status(404).json({
          message: "Order not found"
        });
        return;
      }

      console.log('Processing webhook for order:', order.id, 'payment:', payment.id);

      if (status === "Completed") {
        // Validate order.id exists
        if (!order.id) {
          console.error('Order ID is undefined for payment:', payment.id);
          res.status(500).json({
            message: "Invalid order data"
          });
          return;
        }

        try {
          console.log('Updating payment status for pidx:', pidx);
          // Update payment status to paid
          await Payment.update(
            { paymentStatus: PaymentStatus.Paid },
            { where: { pidx: pidx } }
          );

          console.log('Updating order status for order ID:', order.id);
          // Update order status to preparation
          await Order.update(
            { orderStatus: OrderStatus.Preparation },
            { where: { id: order.id } }
          );
        } catch (updateError) {
          console.error('Error updating payment/order:', updateError);
          res.status(500).json({
            message: "Error updating payment/order status",
            error: updateError instanceof Error ? updateError.message : 'Unknown error'
          });
          return;
        }

        console.log('Payment and order status updated successfully');

        // Emit websocket event for real-time updates
        const io = (global as any).io;
        if (io) {
          io.emit('orderStatusUpdated', {
            orderId: order.id,
            status: OrderStatus.Preparation,
            message: 'Order status updated via webhook'
          });

          io.emit('paymentStatusUpdated', {
            paymentId: payment.id,
            status: PaymentStatus.Paid,
            message: 'Payment completed via webhook'
          });

          console.log('Websocket events emitted for webhook');
        }

        res.status(200).json({
          message: "Payment processed successfully",
          pidx: pidx,
          status: status,
          orderId: order.id
        });
      } else if (status === "Failed" || status === "Cancelled") {
        // Update payment status to unpaid (if it was previously paid)
        await Payment.update(
          { paymentStatus: PaymentStatus.Unpaid },
          { where: { pidx: pidx } }
        );

        // Keep order status as pending
        await Order.update(
          { orderStatus: OrderStatus.Pending },
          { where: { id: order.id } }
        );

        console.log('Payment failed/cancelled, status reverted');

        res.status(200).json({
          message: "Payment failed/cancelled",
          pidx: pidx,
          status: status,
          orderId: order.id
        });
      } else {
        console.log('Unknown payment status:', status);
        res.status(200).json({
          message: "Payment status received but not processed",
          pidx: pidx,
          status: status
        });
      }
    } catch (error) {
      console.error('Error processing Khalti webhook:', error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async fetchAllOrders(req: Request, res: Response): Promise<void> {
    const orders = await Order.findAll({
      attributes: ["totalPrice", "id", "orderStatus","createdAt",'paymentId'],
      include: [
        {
          model: Payment,
          attributes: ["paymentMethod", "paymentStatus"],
        }
      ],
    });
    if (orders.length > 0) {
      res.status(201).json({
        message: "Order fetched successfully",
        data: orders,
      });
    } else {
      res.status(404).json({
        message: "No order found",
        data: [],
      });
    }
  }

  /**
   * Delete multiple orders at once (Admin only)
   * - Validates all orders exist
   * - Prevents deletion of delivered orders
   * - Deletes all order details, orders, and payments in proper sequence
   * - Emits websocket event for real-time updates
   */
  async bulkDeleteOrders(req: Request, res: Response): Promise<void> {
    try {
      const { orderIds } = req.body;
      
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400).json({
          message: "Please provide an array of order IDs to delete"
        });
        return;
      }

      // Validate all orders exist and can be deleted
      const orders = await Order.findAll({
        where: {
          id: orderIds
        }
      });

      if (orders.length !== orderIds.length) {
        const foundIds = orders.map(order => order.id);
        const notFoundIds = orderIds.filter(id => !foundIds.includes(id));
        res.status(404).json({
          message: "Some orders not found",
          notFoundIds: notFoundIds
        });
        return;
      }

      // Check if any delivered orders are in the list
      const deliveredOrders = orders.filter(order => order.orderStatus === OrderStatus.Delivered);
      if (deliveredOrders.length > 0) {
        res.status(400).json({
          message: "Cannot delete delivered orders",
          deliveredOrderIds: deliveredOrders.map(order => order.id)
        });
        return;
      }

      // Get payment IDs for cleanup
      const paymentIds = orders.map(order => order.paymentId);

      // Delete in proper order
      // 1. Delete order details
      await OrderDetails.destroy({
        where: {
          orderId: orderIds
        }
      });

      // 2. Delete orders
      await Order.destroy({
        where: {
          id: orderIds
        }
      });

      // 3. Delete payments
      await Payment.destroy({
        where: {
          id: paymentIds
        }
      });

      // Emit websocket event for real-time updates
      const io = (global as any).io;
      if (io) {
        io.emit('ordersBulkDeleted', {
          orderIds: orderIds,
          count: orderIds.length,
          message: `${orderIds.length} orders deleted by admin`,
          deletedBy: req.user?.id
        });
        console.log('Websocket event emitted for bulk order deletion');
      }

      res.status(200).json({
        message: `${orderIds.length} orders deleted successfully`,
        deletedOrderIds: orderIds,
        count: orderIds.length
      });
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      res.status(500).json({
        message: "Error bulk deleting orders",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new OrderController();
