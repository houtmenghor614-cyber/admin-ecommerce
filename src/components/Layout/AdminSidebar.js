import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = ({ sidebarOpen }) => {
  const menuItems = [
    { path: '/admin', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/admin/products', icon: 'fa-box', label: 'Products' },
    { path: '/admin/categories', icon: 'fa-tags', label: 'Categories' },
    { path: '/admin/orders', icon: 'fa-shopping-cart', label: 'Orders' },
    { path: '/admin/users', icon: 'fa-users', label: 'Users' },
  ];

  return (
    <div className={`sidebar fixed left-0 top-0 h-full bg-white shadow-lg z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="mt-20">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-all duration-300 ${
                isActive ? 'active bg-indigo-600 text-white' : ''
              }`
            }
          >
            <i className={`fas ${item.icon} text-xl ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}></i>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;