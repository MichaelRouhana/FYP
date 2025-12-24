// types/bidding.ts
// Data architecture for Bidding/Bets features
// Structured for future backend integration

export type BidStatus = 'pending' | 'won' | 'lost';

export interface Bid {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  matchTime: string;
  matchDate: string;
  league: string;
  points: number;
  status: BidStatus;
  prediction?: string; // e.g., "Home Win", "Draw", "Away Win", "Over 2.5", etc.
  createdAt: Date;
}

export interface BidsByDate {
  date: string;
  bids: Bid[];
}

