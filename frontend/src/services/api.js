import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const API_URL = process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : (isLocalhost ? 'http://localhost:5000' : '');

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  firebaseAuth: (data) => api.post('/auth/firebase', data),
  getMe: () => api.get('/auth/me')
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: () => api.get('/users/stats'),
  getNotifications: (limit = 30) => api.get('/users/notifications', { params: { limit } }),
  markNotificationsRead: (ids = []) => api.put('/users/notifications/read', { ids })
};

export { API_BASE };

export const artworkAPI = {
  getAll: (params) => api.get('/artworks', { params }),
  getOne: (id) => api.get(`/artworks/${id}`),
  getArtistArtworks: () => api.get('/artworks/artist/artworks'),
  create: (formData) => api.post('/artworks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/artworks/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/artworks/${id}`)
};

export const bidAPI = {
  place: (data) => api.post('/bids', data),
  getUserBids: () => api.get('/bids/user'),
  getArtworkBids: (artworkId) => api.get(`/bids/artwork/${artworkId}`)
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getAuctions: () => api.get('/admin/auctions'),
  getStats: () => api.get('/admin/stats'),
  getPendingVerifications: () => api.get('/admin/pending-verifications'),
  verifyArtist: (id) => api.put(`/admin/verify-artist/${id}`),
  verifyBuyer: (id) => api.put(`/admin/verify-buyer/${id}`),
  verifyArtwork: (id) => api.put(`/admin/verify-artwork/${id}`),
  rejectArtwork: (id, reason) => api.put(`/admin/reject-artwork/${id}`, { reason }),
  removeArtwork: (id) => api.delete(`/admin/artworks/${id}`)
};

export default api;
