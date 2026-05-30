import React from 'react';
import { Link } from 'react-router-dom';

const RecentOrders = ({ orders }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Orders</h2>
        <Link to="/admin/orders" className="text-indigo-600 hover:text-indigo-700">
          View All →
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{order.order_number}</td>
                <td className="px-4 py-3 text-sm">Customer #{order.user_id}</td>
                <td className="px-4 py-3 text-sm font-semibold">${order.total_amount}</td>
                <td className="px-4 py-3">
                  <span className={`${getStatusColor(order.status)} text-white px-2 py-1 rounded-full text-xs`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-700">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;