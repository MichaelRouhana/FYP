// hooks/useBidding.ts
// Mock data hook for Bidding features
// Structured for future backend integration

import { useMemo } from 'react';
import { Bid, BidsByDate, BidStatus } from '@/types/bidding';

// Mock bids data
const MOCK_BIDS: Bid[] = [
  {
    id: 'bid-1',
    matchId: 'match-1',
    homeTeam: 'PSG',
    awayTeam: 'Lorient',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6e/FC_Lorient_logo.svg/800px-FC_Lorient_logo.svg.png',
    homeScore: 1,
    awayScore: 0,
    matchTime: '02:00 PM',
    matchDate: 'Saturday, November 22, 2025',
    league: 'Serie A',
    points: 100,
    status: 'won',
    prediction: 'Home Win',
    createdAt: new Date('2025-11-22'),
  },
  {
    id: 'bid-2',
    matchId: 'match-2',
    homeTeam: 'PSG',
    awayTeam: 'Lorient',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6e/FC_Lorient_logo.svg/800px-FC_Lorient_logo.svg.png',
    homeScore: 1,
    awayScore: 0,
    matchTime: '02:00 PM',
    matchDate: 'Saturday, November 22, 2025',
    league: 'Serie A',
    points: 50,
    status: 'pending',
    prediction: 'Over 2.5 Goals',
    createdAt: new Date('2025-11-22'),
  },
  {
    id: 'bid-3',
    matchId: 'match-3',
    homeTeam: 'PSG',
    awayTeam: 'Lorient',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6e/FC_Lorient_logo.svg/800px-FC_Lorient_logo.svg.png',
    homeScore: 1,
    awayScore: 0,
    matchTime: '02:00 PM',
    matchDate: 'Saturday, November 22, 2025',
    league: 'Serie A',
    points: 100,
    status: 'lost',
    prediction: 'Draw',
    createdAt: new Date('2025-11-22'),
  },
  {
    id: 'bid-4',
    matchId: 'match-4',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    homeScore: null,
    awayScore: null,
    matchTime: '04:00 PM',
    matchDate: 'Sunday, November 23, 2025',
    league: 'Premier League',
    points: 75,
    status: 'pending',
    prediction: 'Home Win',
    createdAt: new Date('2025-11-23'),
  },
  {
    id: 'bid-5',
    matchId: 'match-5',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    homeScore: 2,
    awayScore: 1,
    matchTime: '08:00 PM',
    matchDate: 'Sunday, November 23, 2025',
    league: 'La Liga',
    points: 150,
    status: 'won',
    prediction: 'Home Win',
    createdAt: new Date('2025-11-23'),
  },
];

/**
 * Hook to get user bids
 */
export function useBidding() {
  const allBids = useMemo(() => MOCK_BIDS, []);

  const pendingBids = useMemo(() => {
    return allBids.filter((bid) => bid.status === 'pending');
  }, [allBids]);

  const resultBids = useMemo(() => {
    return allBids.filter((bid) => bid.status === 'won' || bid.status === 'lost');
  }, [allBids]);

  // Group bids by date
  const groupBidsByDate = (bids: Bid[]): BidsByDate[] => {
    const grouped: Record<string, Bid[]> = {};
    
    bids.forEach((bid) => {
      const date = bid.matchDate.toUpperCase();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(bid);
    });

    return Object.entries(grouped).map(([date, bids]) => ({
      date,
      bids: bids.sort((a, b) => a.matchTime.localeCompare(b.matchTime)),
    }));
  };

  const allBidsByDate = useMemo(() => groupBidsByDate(allBids), [allBids]);
  const pendingBidsByDate = useMemo(() => groupBidsByDate(pendingBids), [pendingBids]);
  const resultBidsByDate = useMemo(() => groupBidsByDate(resultBids), [resultBids]);

  return {
    allBids,
    pendingBids,
    resultBids,
    allBidsByDate,
    pendingBidsByDate,
    resultBidsByDate,
    loading: false,
    error: null,
  };
}

export { MOCK_BIDS };

