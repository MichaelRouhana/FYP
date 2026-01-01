import { useState, useEffect, useCallback } from 'react';
import { getAllBets, getAllMockBets, getBetById } from '@/services/betApi';
import { BetViewAllDTO } from '@/types/bet';
import api from '@/services/api';
import { FixtureViewDTO } from '@/types/fixture';

export interface UIBet {
  id: number;
  originalId?: string; // Store original ID for mock bets (e.g., "bet-1")
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  matchTime: string;
  matchDate: string;
  points: number;
  status: 'pending' | 'won' | 'lost';
  selection: string;
  marketType: string;
}

export interface BidsByDate {
  date: string;
  bids: UIBet[];
}

interface UseBettingHistoryReturn {
  loading: boolean;
  error: string | null;
  allBidsByDate: BidsByDate[];
  pendingBidsByDate: BidsByDate[];
  resultBidsByDate: BidsByDate[];
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and organize user's betting history
 * @returns Organized bets by date with different status filters
 */
export const useBettingHistory = (): UseBettingHistoryReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allBidsByDate, setAllBidsByDate] = useState<BidsByDate[]>([]);
  const [pendingBidsByDate, setPendingBidsByDate] = useState<BidsByDate[]>([]);
  const [resultBidsByDate, setResultBidsByDate] = useState<BidsByDate[]>([]);

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch mock bets first
      const mockBets = getAllMockBets();
      
      // Transform mock bets to UI format
      const mockUiBets: UIBet[] = mockBets.map((bet, index) => {
        const timeparts = bet.matchTime.split(' ');
        // Extract numeric ID from "bet-1" format, or use index as fallback
        const numericId = bet.id.startsWith('bet-') 
          ? parseInt(bet.id.replace('bet-', '')) || (index + 1000) // Use 1000+ to avoid conflicts
          : parseInt(bet.id) || (index + 1000);
        
        return {
          id: numericId,
          originalId: bet.id, // Store original ID for navigation
          matchId: String(bet.fixtureId),
          homeTeam: bet.homeTeam,
          awayTeam: bet.awayTeam,
          homeTeamLogo: bet.homeTeamLogo,
          awayTeamLogo: bet.awayTeamLogo,
          homeScore: bet.homeScore,
          awayScore: bet.awayScore,
          matchTime: timeparts[0] || bet.matchTime,
          matchDate: bet.matchDate,
          points: bet.wagerAmount,
          status: bet.status.toLowerCase() as 'pending' | 'won' | 'lost',
          selection: bet.legs.map((leg) => leg.selection).join(' + '),
          marketType: bet.legs.length > 1 ? 'MULTI_LEG' : bet.legs[0]?.marketType || 'MATCH_WINNER',
        };
      });

      // Also try to fetch real bets (if API is available)
      let realUiBets: UIBet[] = [];
      try {
        console.log('[useBettingHistory] Fetching bets from API...');
        // Fetch with larger page size and sort by newest first
        const betsResponse = await getAllBets(0, 50);
        const bets = betsResponse.content;
        console.log(`[useBettingHistory] ✅ Fetched ${bets.length} bets from API`);
        console.log(`[useBettingHistory] 📋 Bet IDs fetched: [${bets.map(b => b.id).join(', ')}]`);

        // Fetch all public fixtures to map bet data
        console.log('[useBettingHistory] Fetching public fixtures for mapping...');
        const fixturesResponse = await api.get<FixtureViewDTO[]>('/fixtures/public');
        const fixtures = fixturesResponse.data;
        console.log(`[useBettingHistory] ✅ Fetched ${fixtures.length} public fixtures`);

        // Create a map for quick fixture lookup
        const fixtureMap = new Map<number, FixtureViewDTO>();
        fixtures.forEach((fixture) => fixtureMap.set(fixture.id, fixture));

        // Transform real bets to UI format
        let mappedCount = 0;
        let missingFixtureCount = 0;
        let missingFixtureIdCount = 0;
        
        realUiBets = bets
          .map((bet: BetViewAllDTO) => {
            const fixtureId = bet.fixtureId; 
            if (!fixtureId) {
              missingFixtureIdCount++;
              console.warn(`[useBettingHistory] ⚠️ Bet ${bet.id} missing fixtureId`);
              return null;
            }
            const fixture = fixtureMap.get(fixtureId);

            if (!fixture) {
              missingFixtureCount++;
              console.warn(`[useBettingHistory] ⚠️ Fixture ${fixtureId} not found in public fixtures for bet ${bet.id} (stake: ${bet.stake}, selection: ${bet.selection})`);
              return null;
            }

            mappedCount++;
            const matchDate = new Date(fixture.rawJson.fixture.date);
            
            return {
              id: bet.id,
              matchId: String(fixtureId),
              homeTeam: fixture.rawJson.teams.home.name,
              awayTeam: fixture.rawJson.teams.away.name,
              homeTeamLogo: fixture.rawJson.teams.home.logo,
              awayTeamLogo: fixture.rawJson.teams.away.logo,
              homeScore: fixture.rawJson.goals.home ?? undefined,
              awayScore: fixture.rawJson.goals.away ?? undefined,
              matchTime: matchDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              matchDate: matchDate.toISOString(),
              points: bet.stake,
              status: bet.status.toLowerCase() as 'pending' | 'won' | 'lost',
              selection: bet.selection,
              marketType: bet.marketType,
            };
          })
          .filter((bet): bet is UIBet => bet !== null);
        
        console.log(`[useBettingHistory] 📊 Mapping summary: ${mappedCount} mapped, ${missingFixtureCount} missing fixtures, ${missingFixtureIdCount} missing fixtureId`);
        
        console.log(`[useBettingHistory] ✅ Successfully mapped ${realUiBets.length} real bets to UI format`);
      } catch (apiError: any) {
        console.error('[useBettingHistory] ❌ Error fetching real bets:', apiError);
        console.error('[useBettingHistory] Error details:', apiError.response?.data || apiError.message);
      }

      // Combine mock and real bets, removing duplicates by ID
      const allUiBets = [...mockUiBets, ...realUiBets];
      const uniqueBets = allUiBets.filter((bet, index, self) => 
        index === self.findIndex((b) => b.id === bet.id)
      );

      console.log(`[useBettingHistory] 📦 Combined bets: ${mockUiBets.length} mock + ${realUiBets.length} real = ${allUiBets.length} total, ${uniqueBets.length} unique`);

      // Group bets by date
      const groupByDate = (bets: UIBet[]): BidsByDate[] => {
        const grouped = bets.reduce((acc, bet) => {
          const date = new Date(bet.matchDate);
          const dateKey = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(bet);
          return acc;
        }, {} as Record<string, UIBet[]>);

        return Object.entries(grouped)
          .map(([date, bids]) => ({ date, bids }))
          .sort((a, b) => {
            const dateA = new Date(a.bids[0].matchDate);
            const dateB = new Date(b.bids[0].matchDate);
            return dateB.getTime() - dateA.getTime(); // Most recent first
          });
      };

      // Filter and group by status
      const allBids = groupByDate(uniqueBets);
      const pendingBids = groupByDate(uniqueBets.filter((bet) => bet.status === 'pending'));
      const resultBids = groupByDate(
        uniqueBets.filter((bet) => bet.status === 'won' || bet.status === 'lost')
      );
      
      console.log(`[useBettingHistory] 📅 Grouped bets: ${allBids.length} date groups (all), ${pendingBids.length} date groups (pending), ${resultBids.length} date groups (results)`);
      console.log(`[useBettingHistory] 📊 Total bets by status: ${uniqueBets.filter(b => b.status === 'pending').length} pending, ${uniqueBets.filter(b => b.status === 'won' || b.status === 'lost').length} results`);

      setAllBidsByDate(allBids);
      setPendingBidsByDate(pendingBids);
      setResultBidsByDate(resultBids);
    } catch (err: any) {
      console.error('Error fetching betting history:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch betting history');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since fetchBets doesn't depend on any props or state

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  return {
    loading,
    error,
    allBidsByDate,
    pendingBidsByDate,
    resultBidsByDate,
    refetch: fetchBets,
  };
};

