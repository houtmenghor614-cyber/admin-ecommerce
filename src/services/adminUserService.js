import api from './api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUserDetail = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};