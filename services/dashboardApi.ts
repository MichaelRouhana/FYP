// services/dashboardApi.ts
// API service for Admin Dashboard

import api from './api';
import { PagedResponse } from '@/types/bet';

// Backend `/dashboard/logs` returns a different paging wrapper than our frontend `PagedResponse<T>`
type BackendPagedResponse<T> = {
  content: T[];
  metadata?: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number; // backend returns 1-based page number
    totalPages: number;
  };
};

type ActivityLogViewDTO = {
  username?: string;
  action?: string;
  path?: string;
  httpMethod?: string;
  ip?: string;
  timestamp?: string;
};

export interface ChartPoint {
  x: string; // Date label (e.g., "MON", "TUE")
  y: number; // Value
}

export interface DashboardUser {
  id: number; // Backend returns Long, mapped to number
  username: string;
  email?: string;
  pfp?: string; // Profile picture URL
  avatarUrl?: string; // Alias for pfp
  totalPoints?: number; // User's balance/points
  points?: number; // Alias for totalPoints
  totalBets?: number; // Total number of bets
  totalWins?: number; // Total number of won bets
  wonBets?: number; // Alias for totalWins
  winRate?: number; // Win rate percentage (0.0 to 100.0)
  about?: string; // User's bio/about section
  country?: string; // User's country from address
  roles?: string[]; // User roles
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
export async function getDashboardLogs(params?: {
  page?: number; // 0-based (Spring Pageable)
  size?: number;
}): Promise<DashboardLog[]> {
  try {
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;

    const response = await api.get<BackendPagedResponse<ActivityLogViewDTO>>('/dashboard/logs', {
      params: {
        page,
        size,
        sort: 'timestamp,desc',
      },
    });

    const rows = response.data?.content || [];

    return rows.map((row, idx) => {
      const method = row.httpMethod || 'N/A';
      const path = row.path || 'N/A';
      const ip = row.ip || 'N/A';
      const username = row.username || 'unknown';
      const action = row.action || 'N/A';

      return {
        // Backend DTO doesn't include an ID, so we synthesize one for React keys
        id: page * size + idx + 1,
        action,
        username,
        timestamp: row.timestamp || '',
        details: `${method} ${path} (${ip})`,
      };
    });
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

// ============================================
// NEW LEADERBOARD ENDPOINTS
// ============================================

/**
 * Fetch all users with optional search and pagination
 * @param page Page number (0-indexed, default: 0)
 * @param search Optional search term for username (case-insensitive)
 * @returns Paged response with users
 */
export async function fetchAllUsers(
  page: number = 0,
  search?: string
): Promise<PagedResponse<DashboardUser>> {
  try {
    const params: any = {
      page,
      size: 20, // Default page size
    };
    
    // Only add search param if it's a non-empty string
    // Empty strings or undefined should not be sent to the API
    if (search && typeof search === 'string' && search.trim().length > 0) {
      params.search = search.trim();
    }
    
    const response = await api.get<PagedResponse<DashboardUser>>('/users', { params });
    
    // Map backend fields to frontend structure
    const mappedContent = response.data.content.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      pfp: user.pfp,
      avatarUrl: user.pfp, // Alias
      totalPoints: user.totalPoints || 0,
      points: user.totalPoints || 0, // Alias
      totalBets: user.totalBets || 0,
      totalWins: user.totalWins || 0,
      wonBets: user.totalWins || 0, // Alias
      winRate: user.winRate || 0,
      about: user.about,
      country: user.country,
      roles: user.roles || [],
    }));
    
    return {
      ...response.data,
      content: mappedContent,
    };
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

/**
 * Fetch top betters sorted by number of won bets
 * @param page Page number (0-indexed, default: 0)
 * @returns Paged response with users sorted by wins
 */
export async function fetchTopBetters(page: number = 0): Promise<PagedResponse<DashboardUser>> {
  try {
    const params = {
      page,
      size: 20, // Default page size
    };
    
    const response = await api.get<PagedResponse<DashboardUser>>('/users/leaderboard/betters', { params });
    
    // Map backend fields to frontend structure
    const mappedContent = response.data.content.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      pfp: user.pfp,
      avatarUrl: user.pfp, // Alias
      totalPoints: user.totalPoints || 0,
      points: user.totalPoints || 0, // Alias
      totalBets: user.totalBets || 0,
      totalWins: user.totalWins || 0,
      wonBets: user.totalWins || 0, // Alias
      winRate: user.winRate || 0,
      about: user.about,
      country: user.country,
      roles: user.roles || [],
    }));
    
    return {
      ...response.data,
      content: mappedContent,
    };
  } catch (error: any) {
    console.error('Error fetching top betters:', error);
    throw error;
  }
}

/**
 * Fetch top users sorted by total points
 * @param page Page number (0-indexed, default: 0)
 * @returns Paged response with users sorted by points (descending)
 */
export async function fetchTopPoints(page: number = 0): Promise<PagedResponse<DashboardUser>> {
  try {
    const params = {
      page,
      size: 20, // Default page size
    };
    
    const response = await api.get<PagedResponse<DashboardUser>>('/users/leaderboard/points', { params });
    
    // Map backend fields to frontend structure
    const mappedContent = response.data.content.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      pfp: user.pfp,
      avatarUrl: user.pfp, // Alias
      totalPoints: user.totalPoints || 0,
      points: user.totalPoints || 0, // Alias
      totalBets: user.totalBets || 0,
      totalWins: user.totalWins || 0,
      wonBets: user.totalWins || 0, // Alias
      winRate: user.winRate || 0,
      about: user.about,
      country: user.country,
      roles: user.roles || [],
    }));
    
    return {
      ...response.data,
      content: mappedContent,
    };
  } catch (error: any) {
    console.error('Error fetching top points:', error);
    throw error;
  }
}

