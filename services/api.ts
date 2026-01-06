import axios from 'axios';
import { Platform } from 'react-native';
import { getItem } from '@/utils/storage';

// ----------------------------------------------------------------------
// 1. CONFIGURATION
// ----------------------------------------------------------------------
// Use localhost for web, local IP for native devices
const IP_ADDRESS = '192.168.10.249'; 
const PORT = '8080';

// On web, use localhost. On native, use the local IP address
const BASE_URL = Platform.OS === 'web' 
  ? `http://localhost:${PORT}/api/v1`
  : `http://${IP_ADDRESS}:${PORT}/api/v1`;

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
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getItem('jwt_token');
      if (token) {
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