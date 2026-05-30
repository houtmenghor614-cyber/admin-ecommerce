import api from './api';

export const adminLogin = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const getCurrentAdmin = async () => {
  const response = await api.get('/users/me');
  return response.data;
};