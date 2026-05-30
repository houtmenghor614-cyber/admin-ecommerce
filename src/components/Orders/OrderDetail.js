import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderDetail, updateOrderStatus } from '../../services/adminOrderService';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      const data = await getOrderDetail(id);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Order not found');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Add this useEffect in OrderDetail.js
useEffect(() => {
  if (order && order.status === 'pending') {
    // Check every 3 seconds if order is pending
    const interval = setInterval(async () => {
      try {
        const result = await verifyPayment(order.order_number);
        if (result.verified) {
          await loadOrder();
          toast.success('Payment confirmed! Your order is now paid.');
        }
      } catch (error) {
        // Silent fail
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }
}, [order]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      loadOrder();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      paid: 'bg-blue-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Orders
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
              <p className="text-gray-600 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className={`${getStatusColor(order.status)} text-white px-4 py-2 rounded-lg`}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-semibold">{item.product_title}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ${item.price_at_time}
                      {item.selected_color && ` | Color: ${item.selected_color}`}
                      {item.selected_size && ` | Size: ${item.selected_size}`}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.quantity * item.price_at_time).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t mt-6 pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Shipping Address:</p>
                <p className="font-semibold mt-1">{order.shipping_address}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Total Amount:</p>
                <p className="text-2xl font-bold text-indigo-600">${order.total_amount}</p>
              </div>
            </div>
          </div>
          
          {order.payment_transaction_id && (
            <div className="border-t mt-6 pt-6">
              <p className="text-gray-600">Payment Transaction ID:</p>
              <p className="font-mono text-sm">{order.payment_transaction_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;