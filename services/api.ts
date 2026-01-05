import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ----------------------------------------------------------------------
// 1. CONFIGURATION
// ----------------------------------------------------------------------
// We use your local IP so the Emulator/Phone can talk to your PC.
// If you switch to Wi-Fi later, you might need to update this to 172.20.10.2
const IP_ADDRESS = '192.168.10.249'; 
const PORT = '8080';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api/v1`;

console.log(`🔌 API Initialized connecting to: ${BASE_URL}`);

// ----------------------------------------------------------------------
// 2. AXIOS INSTANCE
// ----------------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Fail if request takes longer than 10 seconds
});

// ----------------------------------------------------------------------
// 3. INTERCEPTOR (The Security Gatekeeper)
// ----------------------------------------------------------------------
// Before every request is sent, this code runs automatically.
// It checks if we have a saved token and attaches it to the header.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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