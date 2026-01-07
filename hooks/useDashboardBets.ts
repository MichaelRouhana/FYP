// hooks/useDashboardBets.ts
// Hook for fetching dashboard bets data

import { useState, useEffect, useCallback } from 'react';
import {
  getTotalBets,
  getWonBets,
  getLostBets,
  getTopBetters,
  getTopPointers,
  ChartPoint,
  DashboardUser,
} from '@/services/dashboardApi';

export function useDashboardBets() {
  const [totalBets, setTotalBets] = useState<ChartPoint[]>([]);
  const [wonBets, setWonBets] = useState<ChartPoint[]>([]);
  const [lostBets, setLostBets] = useState<ChartPoint[]>([]);
  const [topBetters, setTopBetters] = useState<DashboardUser[]>([]);
  const [topPointers, setTopPointers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardBets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data fallback with curves for visualization
      const mockTotalBets: ChartPoint[] = [
        { x: 'MON', y: 3500 },
        { x: 'TUE', y: 4200 },
        { x: 'WED', y: 2800 },
        { x: 'THU', y: 4500 },
        { x: 'FRI', y: 3800 },
        { x: 'SAT', y: 4800 },
        { x: 'SUN', y: 3600 },
      ];

      const mockWonBets: ChartPoint[] = [
        { x: 'MON', y: 2100 },
        { x: 'TUE', y: 1200 },
        { x: 'WED', y: 1100 },
        { x: 'THU', y: 1800 },
        { x: 'FRI', y: 2200 },
        { x: 'SAT', y: 2900 },
        { x: 'SUN', y: 2000 },
      ];

      const mockLostBets: ChartPoint[] = [
        { x: 'MON', y: 1400 },
        { x: 'TUE', y: 3000 },
        { x: 'WED', y: 1700 },
        { x: 'THU', y: 2700 },
        { x: 'FRI', y: 1600 },
        { x: 'SAT', y: 1900 },
        { x: 'SUN', y: 1600 },
      ];

      const mockTopBetters: DashboardUser[] = [
        { id: '1', username: 'Michael Rouhana', pfp: undefined, totalBets: 1404 },
        { id: '2', username: 'Charbel Bou Abdo', pfp: undefined, totalBets: 600 },
        { id: '3', username: 'Ali Shamas', pfp: undefined, totalBets: 567 },
      ];

      const mockTopPointers: DashboardUser[] = [
        { id: '1', username: 'Michael Rouhana', pfp: undefined, totalPoints: 1404, points: 1404 },
        { id: '2', username: 'Charbel Bou Abdo', pfp: undefined, totalPoints: 600, points: 600 },
        { id: '3', username: 'Ali Shamas', pfp: undefined, totalPoints: 567, points: 567 },
      ];

      // Fetch all bets data in parallel, with mock fallback
      const [totalBetsData, wonBetsData, lostBetsData, bettersData, pointersData] = await Promise.all([
        getTotalBets().catch(() => mockTotalBets),
        getWonBets().catch(() => mockWonBets),
        getLostBets().catch(() => mockLostBets),
        getTopBetters().catch(() => mockTopBetters),
        getTopPointers().catch(() => mockTopPointers),
      ]);

      setTotalBets(totalBetsData);
      setWonBets(wonBetsData);
      setLostBets(lostBetsData);
      setTopBetters(bettersData);
      setTopPointers(pointersData);
    } catch (err: any) {
      console.error('Error fetching dashboard bets data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard bets data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardBets();
  }, [fetchDashboardBets]);

  return {
    totalBets,
    wonBets,
    lostBets,
    topBetters,
    topPointers,
    loading,
    error,
    refetch: fetchDashboardBets,
  };
}

