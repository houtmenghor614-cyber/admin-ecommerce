import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import RecentOrders from './RecentOrders';
import { getProducts } from '../../services/adminProductService';
import { getOrders } from '../../services/adminOrderService';
import { getUsers } from '../../services/adminUserService';
import { getCategories } from '../../services/adminCategoryService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0,
    revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, categories, orders, users] = await Promise.all([
        getProducts(),
        getCategories(),
        getOrders(),
        getUsers()
      ]);
      
      const totalRevenue = orders.reduce((sum, order) => {
        if (order.status === 'delivered' || order.status === 'paid') {
          return sum + order.total_amount;
        }
        return sum;
      }, 0);
      
      setStats({
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        users: users.length,
        revenue: totalRevenue
      });
      
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 7000 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 8000 },
  ];

  const categoryData = [
    { name: 'Men', value: 35 },
    { name: 'Women', value: 40 },
    { name: 'Kids', value: 15 },
    { name: 'Accessories', value: 10 },
  ];

  const COLORS = ['#4f46e5', '#8b5cf6', '#a78bfa', '#c4b5fd'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard title="Total Products" value={stats.products} icon="fa-box" color="bg-blue-500" />
        <StatsCard title="Categories" value={stats.categories} icon="fa-tags" color="bg-green-500" />
        <StatsCard title="Total Orders" value={stats.orders} icon="fa-shopping-cart" color="bg-purple-500" />
        <StatsCard title="Total Users" value={stats.users} icon="fa-users" color="bg-yellow-500" />
        <StatsCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon="fa-dollar-sign" color="bg-red-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <RecentOrders orders={recentOrders} />
    </div>
  );
};

export default Dashboard;