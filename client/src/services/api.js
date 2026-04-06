import axios from 'axios';

// Use Vite env variable provided by Vercel.
// If VITE_API_URL is not set in production, fallback to the Render backend.
const baseURL = import.meta.env.VITE_API_URL?.trim() || 'https://dwcs.onrender.com/api';

const api = axios.create({
    baseURL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
