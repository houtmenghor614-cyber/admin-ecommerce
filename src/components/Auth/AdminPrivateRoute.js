import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../Layout/AdminLayout';

const AdminPrivateRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!admin) {
    return <Navigate to="/admin/login" />;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminPrivateRoute;