import axios from 'axios';

// Create base instance configured for Vite proxy
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT bearer token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for unified error reporting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('amr_token');
        localStorage.removeItem('amr_user');
      }
    }
    return Promise.reject(error);
  }
);
