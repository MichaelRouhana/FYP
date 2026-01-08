import { useState, useEffect, useCallback } from 'react';
import { getAllBets } from '@/services/betApi';
import { BetViewAllDTO } from '@/types/bet';

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
  createdDate?: string; // For grouping accumulator bets
  matchStatus?: string; // e.g., "FT", "NS", "LIVE" - to determine if match is finished
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

      console.log('[useBettingHistory] Fetching bets from API...');
      
      // Fetch real bets from API only (no mock data)
      const betsResponse = await getAllBets(0, 50);
      const bets = betsResponse.content;
      console.log(`[useBettingHistory] ✅ Fetched ${bets.length} bets from API`);
      console.log(`[useBettingHistory] 📋 Bet IDs fetched: [${bets.map(b => b.id).join(', ')}]`);

      // Transform bets to UI format using fixture details from bet object
      const realUiBets: UIBet[] = bets
        .map((bet: BetViewAllDTO) => {
          // Use fixture details directly from bet object
          if (!bet.homeTeam || !bet.awayTeam) {
            console.warn(`[useBettingHistory] ⚠️ Bet ${bet.id} missing fixture details (homeTeam: ${bet.homeTeam}, awayTeam: ${bet.awayTeam})`);
            return null;
          }

          // Parse match date from bet object
          const matchDate = bet.matchDate ? new Date(bet.matchDate) : new Date();
          
          const uiBet: UIBet = {
            id: bet.id,
            matchId: String(bet.fixtureId || bet.id),
            homeTeam: bet.homeTeam,
            awayTeam: bet.awayTeam,
            homeTeamLogo: bet.homeTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(bet.homeTeam)}&background=3b82f6&color=fff&size=200`,
            awayTeamLogo: bet.awayTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(bet.awayTeam)}&background=3b82f6&color=fff&size=200`,
            homeScore: bet.homeScore,
            awayScore: bet.awayScore,
            matchTime: matchDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            matchDate: matchDate.toISOString(),
            points: bet.stake,
            status: bet.status.toLowerCase() as 'pending' | 'won' | 'lost',
            selection: bet.selection,
            marketType: bet.marketType,
            createdDate: bet.createdDate ? new Date(bet.createdDate).toISOString() : undefined,
            matchStatus: bet.matchStatus, // Store match status for filtering
          };
          
          console.log(`[useBettingHistory] 📝 Mapped bet ${bet.id}: stake=${bet.stake}, matchStatus=${bet.matchStatus}, selection=${bet.selection}`);
          return uiBet;
        })
        .filter((bet): bet is UIBet => bet !== null);
      
      console.log(`[useBettingHistory] ✅ Successfully mapped ${realUiBets.length} real bets to UI format`);

      const uniqueBets = realUiBets;

      // Group accumulator bets together
      // Accumulator bets are bets with the same stake and created within 2 seconds of each other
      const groupAccumulatorBets = (bets: UIBet[]): UIBet[] => {
        console.log(`[useBettingHistory] 🔍 Starting accumulator grouping for ${bets.length} bets`);
        
        // Sort bets by createdDate (if available) or by ID
        const sortedBets = [...bets].sort((a, b) => {
          if (a.createdDate && b.createdDate) {
            return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          }
          return a.id - b.id;
        });
        
        // Log bet details for debugging
        sortedBets.forEach((bet, idx) => {
          console.log(`[useBettingHistory] 📋 Bet ${idx + 1}: ID=${bet.id}, stake=${bet.points}, matchId=${bet.matchId}, createdDate=${bet.createdDate || 'N/A'}, selection=${bet.selection}`);
        });
        
        const grouped: UIBet[] = [];
        const processed = new Set<number>();
        
        for (let i = 0; i < sortedBets.length; i++) {
          if (processed.has(sortedBets[i].id)) continue;
          
          const currentBet = sortedBets[i];
          const accumulatorGroup: UIBet[] = [currentBet];
          processed.add(currentBet.id);
          
          // Look for other bets with the same stake created within 2 seconds
          const currentTime = currentBet.createdDate 
            ? new Date(currentBet.createdDate).getTime() 
            : currentBet.id; // Fallback to ID if no createdDate
          
          console.log(`[useBettingHistory] 🔎 Checking bet ${currentBet.id} (stake=${currentBet.points}, time=${currentTime})`);
          
          for (let j = i + 1; j < sortedBets.length; j++) {
            const nextBet = sortedBets[j];
            if (processed.has(nextBet.id)) continue;
            
            const nextTime = nextBet.createdDate 
              ? new Date(nextBet.createdDate).getTime() 
              : nextBet.id;
            
            // Group if: same stake and created within 2 seconds (or sequential IDs if no timestamp)
            // Note: Accumulator bets can be on different matches, so we don't require same matchId
            const timeDiff = Math.abs(nextTime - currentTime);
            const idDiff = Math.abs(nextBet.id - currentBet.id);
            const isWithinTimeWindow = currentBet.createdDate 
              ? timeDiff <= 2000 // 2 seconds in milliseconds
              : idDiff <= 10; // Within 10 IDs if no timestamp (more lenient for accumulator bets)
            
            const hasSameStake = Math.abs(nextBet.points - currentBet.points) < 0.01; // Account for floating point precision
            
            console.log(`[useBettingHistory] Checking bet ${nextBet.id}: stake=${nextBet.points} vs ${currentBet.points}, sameStake=${hasSameStake}, timeDiff=${timeDiff}ms, idDiff=${idDiff}, withinWindow=${isWithinTimeWindow}`);
            
            if (hasSameStake && isWithinTimeWindow) {
              accumulatorGroup.push(nextBet);
              processed.add(nextBet.id);
              console.log(`[useBettingHistory] ✅ Added bet ${nextBet.id} to accumulator group (now ${accumulatorGroup.length} bets)`);
            } else if (currentBet.createdDate && timeDiff > 2000) {
              // If we have timestamps and the gap is too large, stop looking
              console.log(`[useBettingHistory] ⏹️ Stopping search: timeDiff ${timeDiff}ms > 2000ms`);
              break;
            } else if (!currentBet.createdDate && idDiff > 10) {
              // If no timestamp and IDs are too far apart, stop looking
              console.log(`[useBettingHistory] ⏹️ Stopping search: ID diff ${idDiff} > 10`);
              break;
            } else if (!hasSameStake && idDiff > 3) {
              // If stakes don't match and IDs are getting far apart, stop looking
              console.log(`[useBettingHistory] ⏹️ Stopping search: different stake and ID diff ${idDiff} > 3`);
              break;
            }
          }
          
          // If we found multiple bets, combine them into one accumulator bet
          if (accumulatorGroup.length > 1) {
            // Use the first bet's ID and combine selections
            const combinedBet: UIBet = {
              ...currentBet,
              selection: accumulatorGroup.map(b => b.selection).join(' + '),
              marketType: 'MULTI_LEG',
            };
            grouped.push(combinedBet);
            console.log(`[useBettingHistory] 🔗 Grouped ${accumulatorGroup.length} bets into accumulator: ${combinedBet.id} (${combinedBet.selection})`);
          } else {
            // Single bet, add as is
            grouped.push(currentBet);
            console.log(`[useBettingHistory] ➕ Added single bet: ${currentBet.id}`);
          }
        }
        
        console.log(`[useBettingHistory] 📊 Grouping complete: ${bets.length} → ${grouped.length} bets`);
        return grouped;
      };

      // Group accumulator bets before grouping by date
      const groupedBets = groupAccumulatorBets(uniqueBets);
      console.log(`[useBettingHistory] 📊 After accumulator grouping: ${uniqueBets.length} → ${groupedBets.length} bets`);

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

            // Filter and group by status (using grouped bets)
            // Helper to check if match is finished based on matchStatus
            const isMatchFinished = (matchStatus?: string): boolean => {
              if (!matchStatus) return false;
              const finishedStatuses = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
              return finishedStatuses.includes(matchStatus);
            };

            const allBids = groupByDate(groupedBets);
            // Pending tab: bets that are pending AND match is not finished
            const pendingBids = groupByDate(
              groupedBets.filter((bet) => bet.status === 'pending' && !isMatchFinished(bet.matchStatus))
            );
            // Results tab: bets that are won/lost OR matches that are finished (even if bet is pending)
            const resultBids = groupByDate(
              groupedBets.filter((bet) => 
                bet.status === 'won' || 
                bet.status === 'lost' || 
                (bet.status === 'pending' && isMatchFinished(bet.matchStatus))
              )
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

