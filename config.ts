/**
 * Application Configuration
 * 
 * This file reads environment variables for API configuration.
 * 
 * For Expo projects, environment variables can be set in two ways:
 * 1. Using EXPO_PUBLIC_ prefix in .env file (e.g., EXPO_PUBLIC_API_BASE_URL)
 * 2. Using app.json extra field (see app.json for example)
 * 
 * To use: 
 * - Copy .env.example to .env and update the values
 * - Or update app.json extra field with your API configuration
 */

import Constants from 'expo-constants';

// Helper function to get environment variable with fallback
const getEnv = (key: string, defaultValue: string): string => {
  // Try to get from expo-constants extra config first (from app.json)
  const extraConfig = Constants.expoConfig?.extra;
  if (extraConfig && extraConfig[key]) {
    return extraConfig[key];
  }
  
  // Fallback to process.env (works with EXPO_PUBLIC_ prefix)
  return process.env[key] || process.env[`EXPO_PUBLIC_${key}`] || defaultValue;
};

// API Configuration
export const API_CONFIG = {
  // Base URL for web platform
  baseUrl: getEnv('API_BASE_URL', 'http://localhost:8080'),
  
  // IP Address for native platforms (Android/iOS)
  ipAddress: getEnv('API_IP_ADDRESS', '192.168.10.249'),
  
  // Port number
  port: getEnv('API_PORT', '8080'),
  
  // API path prefix
  pathPrefix: getEnv('API_PATH_PREFIX', '/api/v1'),
} as const;

// Helper to build the full API URL based on platform
export const getApiBaseUrl = (platform: string): string => {
  if (platform === 'web') {
    // For web, use baseUrl directly
    return `${API_CONFIG.baseUrl}${API_CONFIG.pathPrefix}`;
  } else {
    // For native (iOS/Android), use IP address
    return `http://${API_CONFIG.ipAddress}:${API_CONFIG.port}${API_CONFIG.pathPrefix}`;
  }
};

export default API_CONFIG;

