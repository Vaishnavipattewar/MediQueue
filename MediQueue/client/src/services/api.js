import axios from 'axios';

/**
 * Axios instance for all API calls.
 * Base URL is proxied to http://localhost:5000 by Vite in development.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request interceptor: inject Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('hqs_user');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore parse errors */
  }
  return config;
});

// ─── Response interceptor: handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid – clear session and redirect to login
      localStorage.removeItem('hqs_user');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
