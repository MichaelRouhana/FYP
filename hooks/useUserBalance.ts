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
      
      // Check if mock balance is set
      let mockBalance = getMockUserBalance();
      
      if (mockBalance === null) {
        // Initialize from API on first load
        const session = await getUserSession();
        mockBalance = session.points || 0;
        // Set mock balance for future use
        setMockUserBalance(mockBalance);
        setUserSession(session);
      } else {
        // Use mock balance
        setUserSession({
          points: mockBalance,
          email: '',
          username: '',
          pfp: '',
          roles: [],
        });
      }
    } catch (err: any) {
      console.error('Error fetching user balance:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch user balance');
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

