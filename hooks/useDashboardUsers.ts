// hooks/useDashboardUsers.ts
// Hook for fetching dashboard users data

import { useState, useEffect, useCallback } from 'react';
import {
  getTotalUsers,
  getTotalActiveUsers,
  getDashboardUsers,
  getDashboardLogs,
  ChartPoint,
  DashboardUser,
  DashboardLog,
} from '@/services/dashboardApi';

export interface DashboardUsersData {
  totalUsers: ChartPoint[];
  totalActiveUsers: ChartPoint[];
  users: DashboardUser[];
  logs: DashboardLog[];
  loading: boolean;
  error: string | null;
}

export function useDashboardUsers() {
  const [totalUsers, setTotalUsers] = useState<ChartPoint[]>([]);
  const [totalActiveUsers, setTotalActiveUsers] = useState<ChartPoint[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [logs, setLogs] = useState<DashboardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [totalUsersData, activeUsersData, usersData, logsData] = await Promise.all([
        getTotalUsers(),
        getTotalActiveUsers(),
        getDashboardUsers(),
        getDashboardLogs().catch(() => []), // Logs might not be implemented
      ]);

      setTotalUsers(totalUsersData);
      setTotalActiveUsers(activeUsersData);
      setUsers(usersData);
      setLogs(logsData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    totalUsers,
    totalActiveUsers,
    users,
    logs,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

