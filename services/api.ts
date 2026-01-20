import axios from 'axios';
import { Platform } from 'react-native';
import { getItem } from '@/utils/storage';
import { getApiBaseUrl } from '@/config';

// ----------------------------------------------------------------------
// 1. CONFIGURATION
// ----------------------------------------------------------------------
// API base URL is now configured via environment variables
// See config.ts and .env.example for configuration options
const BASE_URL = getApiBaseUrl(Platform.OS);

console.log(`🔌 API Initialized connecting to: ${BASE_URL} (Platform: ${Platform.OS})`);

// ----------------------------------------------------------------------
// 2. AXIOS INSTANCE
// ----------------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Fail if request takes longer than 10 seconds
});

// ----------------------------------------------------------------------
// 3. INTERCEPTOR (The Security Gatekeeper)
// ----------------------------------------------------------------------
// Before every request is sent, this code runs automatically.
// It checks if we have a saved token and attaches it to the header.
// Public endpoints (login, signup, register) should NOT have tokens attached.
api.interceptors.request.use(
  async (config) => {
    try {
      // Define public endpoints that should not have tokens attached
      const isPublicEndpoint = 
        config.url?.includes('/users/login') || 
        config.url?.includes('/users/signup') || 
        config.url?.includes('/users/register') ||
        config.url?.includes('/users/verify') ||
        config.url?.includes('/users/login/google');

      // Only attach token if it exists AND the endpoint is not public
      const token = await getItem('jwt_token');
      if (token && !isPublicEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // For FormData uploads, don't set Content-Type - let the browser/axios set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      console.error('Error fetching token for API request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// 4. ERROR HANDLING (Optional but recommended)
// ----------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Token expired or invalid
      console.log('⚠️ Session expired or access denied.');
    }
    return Promise.reject(error);
  }
);

export default api;