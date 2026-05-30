import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '../../services/adminOrderService';
import toast from 'react-hot-toast';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      loadOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      paid: 'bg-green-500',
      shipped: 'bg-blue-500',
      delivered: 'bg-purple-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'fa-clock',
      paid: 'fa-check-circle',
      shipped: 'fa-truck',
      delivered: 'fa-check-double',
      cancelled: 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending Payment',
      paid: 'Paid ✓',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Phnom_Penh'
    });
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_phone?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(2)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <i className="fas fa-shopping-cart text-indigo-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Shipped</p>
              <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-truck text-blue-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-purple-600">{stats.delivered}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-check-double text-purple-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-indigo-600">${stats.totalRevenue}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <i className="fas fa-dollar-sign text-indigo-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === 'paid' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid ({stats.paid})
            </button>
            <button
              onClick={() => setFilter('shipped')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === 'shipped' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shipped ({stats.shipped})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filter === 'delivered' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered ({stats.delivered})
            </button>
          </div>
          
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-80"
            />
          </div>
        </div>
      </div>

      {/* Orders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200">
            {/* Order Status Header */}
            <div className={`px-4 py-3 ${order.status === 'paid' ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <i className={`fas ${getStatusIcon(order.status)} ${order.status === 'paid' ? 'text-green-600' : 'text-gray-600'}`}></i>
                  <span className={`font-semibold ${order.status === 'paid' ? 'text-green-700' : 'text-gray-700'}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusColor(order.status)} text-white`}
                >
                  <option value="pending" className="text-gray-800 bg-white">Pending</option>
                  <option value="paid" className="text-gray-800 bg-white">Paid</option>
                  <option value="shipped" className="text-gray-800 bg-white">Shipped</option>
                  <option value="delivered" className="text-gray-800 bg-white">Delivered</option>
                  <option value="cancelled" className="text-gray-800 bg-white">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Order Body */}
            <div className="p-4">
              {/* Order ID */}
              <div className="mb-3 pb-2 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="font-mono text-sm font-semibold text-gray-800">{order.order_number}</p>
              </div>
              
              {/* Customer Information */}
              <div className="mb-3 pb-2 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Customer Information</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user text-gray-400 text-xs w-4"></i>
                    <span className="text-sm text-gray-800">{order.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-envelope text-gray-400 text-xs w-4"></i>
                    <span className="text-sm text-gray-600">{order.customer_email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-phone text-gray-400 text-xs w-4"></i>
                    <span className="text-sm text-gray-600">{order.customer_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div className="mb-3 pb-2 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Shipping Address</p>
                <div className="flex items-start gap-2">
                  <i className="fas fa-location-dot text-gray-400 text-xs mt-0.5 w-4"></i>
                  <p className="text-sm text-gray-700">{order.shipping_address || 'N/A'}</p>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="mb-3 pb-2 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-indigo-600">{formatPrice(order.total_amount)}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Items</p>
                  <p className="text-sm text-gray-600">{order.items?.length || 0} item(s)</p>
                </div>
              </div>
              
              {/* Items Preview */}
              {order.items && order.items.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Items Preview</p>
                  <div className="space-y-2">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {item.product_main_image ? (
                          <img 
                            src={`http://127.0.0.1:8000${item.product_main_image}`} 
                            alt={item.product_title}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <i className="fas fa-image text-gray-400 text-xs"></i>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{item.product_title}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × ${item.price_at_time}
                            {item.selected_size && <span className="ml-1">Size: {item.selected_size}</span>}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          ${(item.quantity * item.price_at_time).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        + {order.items.length - 2} more item(s)
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* View Details Button */}
              <Link
                to={`/admin/orders/${order.id}`}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                <i className="fas fa-eye"></i>
                View Order Details
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrderList;