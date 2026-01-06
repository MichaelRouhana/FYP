// services/dashboardApi.ts
// API service for Admin Dashboard

import api from './api';

export interface ChartPoint {
  x: string; // Date label (e.g., "MON", "TUE")
  y: number; // Value
}

export interface DashboardUser {
  id: string;
  username: string;
  pfp?: string;
  totalPoints?: number;
  points?: number;
}

export interface DashboardLog {
  id: number;
  action: string;
  details: string;
  username: string;
  timestamp: string; // ISO string from LocalDateTime
}

export interface DashboardUsersData {
  totalUsers: ChartPoint[];
  totalActiveUsers: ChartPoint[];
  users: DashboardUser[];
  logs: DashboardLog[];
}

/**
 * Fetch total users chart data
 */
export async function getTotalUsers(): Promise<ChartPoint[]> {
  try {
    const response = await api.get('/dashboard/totalUsers');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching total users:', error);
    throw error;
  }
}

/**
 * Fetch total active users chart data
 */
export async function getTotalActiveUsers(): Promise<ChartPoint[]> {
  try {
    const response = await api.get('/dashboard/totalActiveUsers');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching total active users:', error);
    throw error;
  }
}

/**
 * Fetch dashboard users list (top users)
 */
export async function getDashboardUsers(): Promise<DashboardUser[]> {
  try {
    const response = await api.get('/dashboard/users');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching dashboard users:', error);
    throw error;
  }
}

/**
 * Fetch dashboard logs
 */
export async function getDashboardLogs(): Promise<DashboardLog[]> {
  try {
    const response = await api.get('/dashboard/logs');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching dashboard logs:', error);
    // Logs endpoint might not be implemented yet, return empty array
    if (error.response?.status === 501 || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

