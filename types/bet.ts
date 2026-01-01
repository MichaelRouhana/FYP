// Backend Betting API Types

export enum MarketType {
  MATCH_WINNER = 'MATCH_WINNER',           // 1X2 (Home, Draw, Away)
  BOTH_TEAMS_TO_SCORE = 'BOTH_TEAMS_TO_SCORE',
  GOALS_OVER_UNDER = 'GOALS_OVER_UNDER',
  FIRST_TEAM_TO_SCORE = 'FIRST_TEAM_TO_SCORE',
  DOUBLE_CHANCE = 'DOUBLE_CHANCE',
  SCORE_PREDICTION = 'SCORE_PREDICTION',
}

export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  VOID = 'VOID',
}

// Request DTO for placing a bet
export interface BetRequestDTO {
  fixtureId: number;
  marketType: MarketType;
  selection: string; // e.g., "HOME", "DRAW", "AWAY" for MATCH_WINNER
  stake: number; // Amount to bet
  odd?: number; // Odds for this selection (optional, but recommended)
}

// Response DTO for bet creation
export interface BetResponseDTO {
  id: number;
  fixtureId: number;
  marketType: MarketType;
  selection: string;
  status: BetStatus;
}

// View DTO for bet details
export interface BetViewDTO {
  id: number;
  fixtureId: number;
  marketType: MarketType;
  stake: number;
  selection: string;
  betStatus: BetStatus;
}

// All bets view (simplified)
export interface BetViewAllDTO {
  id: number;
  marketType: string;
  selection: string;
  stake: number;
  status: string;
}

// Paged response wrapper
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// User session with points
export interface UserSession {
  accessToken?: string;
  email: string;
  username: string;
  pfp: string;
  roles: string[];
  points: number;
}

// Selection options for MATCH_WINNER market
export type MatchWinnerSelection = 'HOME' | 'DRAW' | 'AWAY';

// Frontend UI types for bidding screen
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
  points: number;
  status: 'pending' | 'won' | 'lost';
  selection: string;
  marketType: string;
}

