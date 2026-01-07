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
  totalBets?: number; // For top betters
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

export interface DashboardStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
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

/**
 * Fetch total bets chart data
 */
export async function getTotalBets(): Promise<ChartPoint[]> {
  try {
    const response = await api.get('/dashboard/totalBets');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching total bets:', error);
    throw error;
  }
}

/**
 * Fetch won bets chart data
 */
export async function getWonBets(): Promise<ChartPoint[]> {
  try {
    const response = await api.get('/dashboard/wonBets');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching won bets:', error);
    throw error;
  }
}

/**
 * Fetch lost bets chart data
 */
export async function getLostBets(): Promise<ChartPoint[]> {
  try {
    const response = await api.get('/dashboard/lostBets');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching lost bets:', error);
    throw error;
  }
}

/**
 * Fetch dashboard stats (total/won/lost bets)
 */
export async function getDashboardStats(timeRange: '24h' | '7d' | 'all' = '7d'): Promise<DashboardStats> {
  try {
    const response = await api.get('/dashboard/stats', {
      params: { range: timeRange },
    });
    return response.data || { totalBets: 0, wonBets: 0, lostBets: 0 };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetch top betters (users with most bets)
 */
export async function getTopBetters(timeRange: '24h' | '7d' | 'all' = '7d'): Promise<DashboardUser[]> {
  try {
    const response = await api.get('/dashboard/topBetters', {
      params: { range: timeRange },
    });
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching top betters:', error);
    throw error;
  }
}

/**
 * Fetch top pointers (users with most points)
 */
export async function getTopPointers(timeRange: '24h' | '7d' | 'all' = '7d'): Promise<DashboardUser[]> {
  try {
    const response = await api.get('/dashboard/topPointers', {
      params: { range: timeRange },
    });
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching top pointers:', error);
    throw error;
  }
}

