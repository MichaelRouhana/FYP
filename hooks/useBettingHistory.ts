import { useState, useEffect } from 'react';
import { getAllBets } from '@/services/betApi';
import { BetViewAllDTO } from '@/types/bet';
import api from '@/services/api';
import { FixtureViewDTO } from '@/types/fixture';

export interface UIBet {
  id: number;
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

  const fetchBets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all user bets
      const betsResponse = await getAllBets();
      const bets = betsResponse.content;

      // Fetch all public fixtures to map bet data
      const fixturesResponse = await api.get<FixtureViewDTO[]>('/fixtures/public');
      const fixtures = fixturesResponse.data;

      // Create a map for quick fixture lookup
      const fixtureMap = new Map<number, FixtureViewDTO>();
      fixtures.forEach((fixture) => fixtureMap.set(fixture.id, fixture));

      // Transform bets to UI format
      const uiBets: UIBet[] = bets
        .map((bet: BetViewAllDTO) => {
          // Find fixture by ID - note: bet might not have fixtureId exposed
          // If BetViewAllDTO doesn't include fixtureId, we need to get it from another source
          // For now, assuming we can access it somehow or need backend update
          
          // Placeholder - you may need to adjust based on actual API response
          const fixtureId = (bet as any).fixtureId; 
          const fixture = fixtureMap.get(fixtureId);

          if (!fixture) {
            return null; // Skip bets without fixture data
          }

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
      const allBids = groupByDate(uiBets);
      const pendingBids = groupByDate(uiBets.filter((bet) => bet.status === 'pending'));
      const resultBids = groupByDate(
        uiBets.filter((bet) => bet.status === 'won' || bet.status === 'lost')
      );

      setAllBidsByDate(allBids);
      setPendingBidsByDate(pendingBids);
      setResultBidsByDate(resultBids);
    } catch (err: any) {
      console.error('Error fetching betting history:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch betting history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  return {
    loading,
    error,
    allBidsByDate,
    pendingBidsByDate,
    resultBidsByDate,
    refetch: fetchBets,
  };
};

