import { useState, useEffect, useCallback } from 'react';
import { getUserSession, getMockUserBalance, setMockUserBalance } from '@/services/betApi';
import { UserSession } from '@/types/bet';

interface UseUserBalanceReturn {
  loading: boolean;
  error: string | null;
  balance: number;
  userSession: UserSession | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user balance (points)
 * @returns User balance, session data, and loading state
 */
export const useUserBalance = (): UseUserBalanceReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch from API to get real-time balance
      const session = await getUserSession();
      const realBalance = session.points || 0;
      
      // Update mock balance to match real balance
      setMockUserBalance(realBalance);
      setUserSession(session);
      
      console.log('[useUserBalance] ✅ Balance fetched from API:', realBalance);
    } catch (err: any) {
      console.error('[useUserBalance] ❌ Error fetching user balance:', err);
      
      // Fallback to mock balance if API fails
      const mockBalance = getMockUserBalance();
      if (mockBalance !== null) {
        console.log('[useUserBalance] ⚠️ Using cached mock balance:', mockBalance);
        setUserSession({
          points: mockBalance,
          email: '',
          username: '',
          pfp: '',
          roles: [],
        });
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch user balance');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    loading,
    error,
    balance: userSession?.points || 0,
    userSession,
    refetch: fetchBalance,
  };
};

