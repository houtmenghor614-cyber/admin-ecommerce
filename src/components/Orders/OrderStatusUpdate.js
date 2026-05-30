import React, { useState } from 'react';
import { updateOrderStatus } from '../../services/adminOrderService';
import toast from 'react-hot-toast';

const OrderStatusUpdate = ({ orderId, currentStatus, onStatusUpdated }) => {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'paid', label: 'Paid', color: 'bg-blue-500' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
};

export default OrderStatusUpdate;