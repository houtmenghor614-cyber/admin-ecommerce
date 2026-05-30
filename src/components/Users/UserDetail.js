import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetail } from '../../services/adminUserService';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const data = await getUserDetail(id);
      setUser(data);
    } catch (error) {
      console.error('Failed to load user:', error);
      toast.error('User not found');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Users
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            {user.picture ? (
              <img src={user.picture} alt={user.full_name} className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-4xl text-indigo-600"></i>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                user.is_google_user ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {user.is_google_user ? 'Google Account' : 'Email Account'}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-semibold">{user.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold">{user.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined Date</p>
                <p className="font-semibold">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;