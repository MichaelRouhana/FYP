import api from './api';
import { 
  BetRequestDTO, 
  BetResponseDTO, 
  BetViewAllDTO, 
  PagedResponse,
  UserSession,
  MarketType,
  BetStatus
} from '@/types/bet';

// ============================================
// MOCK BET STORAGE (In-Memory)
// ============================================

interface MockBetLeg {
  id: string;
  marketType: MarketType;
  selection: string;
  odds: number;
  status: 'Pending' | 'Won' | 'Lost' | 'Void';
}

interface MockBetSlip {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore?: number;
  awayScore?: number;
  matchTime: string;
  matchDate: string;
  wagerAmount: number;
  status: 'Pending' | 'Won' | 'Lost';
  legs: MockBetLeg[];
  createdAt: string;
}

// In-memory storage
let MOCK_BETS: MockBetSlip[] = [];
let nextBetId = 1;

// Mock user balance (in-memory)
let MOCK_USER_BALANCE: number | null = null; // null means use real API balance

// Helper to generate random odds between min and max
const generateRandomOdds = (min: number = 1.2, max: number = 3.5): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

/**
 * Get odds for a specific market/selection (exported for use in UI)
 */
export const getOddsForSelection = (marketType: MarketType, selection: string): number => {
  // Return realistic odds based on market type
  switch (marketType) {
    case MarketType.MATCH_WINNER:
      if (selection === 'HOME') return generateRandomOdds(1.3, 2.5);
      if (selection === 'DRAW') return generateRandomOdds(2.8, 4.5);
      if (selection === 'AWAY') return generateRandomOdds(1.5, 3.0);
      break;
    case MarketType.GOALS_OVER_UNDER:
      if (selection === 'Over 2.5') return generateRandomOdds(1.6, 2.2);
      if (selection === 'Under 2.5') return generateRandomOdds(1.5, 2.0);
      break;
    case MarketType.BOTH_TEAMS_TO_SCORE:
      if (selection === 'Yes') return generateRandomOdds(1.4, 2.0);
      if (selection === 'No') return generateRandomOdds(1.3, 1.9);
      break;
    case MarketType.FIRST_TEAM_TO_SCORE:
      if (selection === 'HOME') return generateRandomOdds(1.8, 2.8);
      if (selection === 'AWAY') return generateRandomOdds(2.0, 3.2);
      break;
    case MarketType.DOUBLE_CHANCE:
      if (selection === 'x1') return generateRandomOdds(1.2, 1.6);
      if (selection === '12') return generateRandomOdds(1.1, 1.4);
      if (selection === 'x2') return generateRandomOdds(1.3, 1.8);
      break;
    case MarketType.SCORE_PREDICTION:
      return generateRandomOdds(5.0, 15.0); // Higher odds for exact score
  }
  return generateRandomOdds();
};

// ============================================
// MOCK API FUNCTIONS
// ============================================

/**
 * Place a new bet (mock version)
 * Accepts a multi-leg bet request
 */
export interface MultiLegBetRequest {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  matchTime: string;
  matchDate: string;
  wagerAmount: number;
  legs: Array<{
    marketType: MarketType;
    selection: string;
    odds?: number; // Optional - will generate if not provided
  }>;
}

export const placeBet = async (betRequest: BetRequestDTO): Promise<BetResponseDTO> => {
  // For single-leg bets, use real API or mock
  const response = await api.post<BetResponseDTO>('/bets', betRequest);
  return response.data;
};

/**
 * Place a multi-leg bet (mock version)
 */
export const placeMultiLegBet = async (
  betRequest: MultiLegBetRequest,
  currentBalance?: number
): Promise<MockBetSlip> => {
  // Check balance if provided
  if (currentBalance !== undefined) {
    if (currentBalance < betRequest.wagerAmount) {
      throw new Error('Insufficient balance');
    }
    // Deduct from mock balance
    if (MOCK_USER_BALANCE !== null) {
      MOCK_USER_BALANCE -= betRequest.wagerAmount;
      console.log('[betApi] 💰 Deducted', betRequest.wagerAmount, 'PTS. New balance:', MOCK_USER_BALANCE);
    }
  }

  const betId = `bet-${nextBetId++}`;
  const now = new Date().toISOString();

  // Generate legs with odds
  const legs: MockBetLeg[] = betRequest.legs.map((leg, index) => ({
    id: `leg-${betId}-${index + 1}`,
    marketType: leg.marketType,
    selection: leg.selection,
    odds: leg.odds || getOddsForSelection(leg.marketType, leg.selection),
    status: 'Pending' as const,
  }));

  // Create bet slip
  const betSlip: MockBetSlip = {
    id: betId,
    fixtureId: betRequest.fixtureId,
    homeTeam: betRequest.homeTeam,
    awayTeam: betRequest.awayTeam,
    homeTeamLogo: betRequest.homeTeamLogo,
    awayTeamLogo: betRequest.awayTeamLogo,
    homeScore: undefined,
    awayScore: undefined,
    matchTime: betRequest.matchTime,
    matchDate: betRequest.matchDate,
    wagerAmount: betRequest.wagerAmount,
    status: 'Pending',
    legs,
    createdAt: now,
  };

  // Add to storage
  MOCK_BETS.push(betSlip);

  console.log('[betApi] ✅ Placed multi-leg bet:', betId, 'with', legs.length, 'legs');
  return betSlip;
};

/**
 * Set mock user balance (for testing)
 * If set to null, will use real API balance
 */
export const setMockUserBalance = (balance: number | null): void => {
  MOCK_USER_BALANCE = balance;
  console.log('[betApi] 💰 Mock balance set to:', balance);
};

/**
 * Initialize mock balance from real API (call this on app start)
 */
export const initializeMockBalance = async (): Promise<void> => {
  try {
    const session = await getUserSession();
    if (session.points !== undefined) {
      MOCK_USER_BALANCE = session.points;
      console.log('[betApi] 💰 Initialized mock balance from API:', MOCK_USER_BALANCE);
    }
  } catch (err) {
    console.warn('[betApi] Could not initialize mock balance from API');
  }
};

/**
 * Get mock user balance
 */
export const getMockUserBalance = (): number | null => {
  return MOCK_USER_BALANCE;
};

/**
 * Get all bets (mock version)
 */
export const getAllBets = async (
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<BetViewAllDTO>> => {
  // Convert mock bets to BetViewAllDTO format
  const allBets: BetViewAllDTO[] = MOCK_BETS.map((bet) => {
    // Calculate total odds
    const totalOdds = bet.legs.reduce((acc, leg) => acc * leg.odds, 1);
    
    // Determine status based on legs
    let status = 'PENDING';
    if (bet.legs.some((leg) => leg.status === 'Lost')) {
      status = 'LOST';
    } else if (bet.legs.every((leg) => leg.status === 'Won')) {
      status = 'WON';
    }

    return {
      id: parseInt(bet.id.replace('bet-', '')) || 0,
      marketType: bet.legs.length > 1 ? 'MULTI_LEG' : bet.legs[0]?.marketType || MarketType.MATCH_WINNER,
      selection: bet.legs.map((leg) => `${leg.selection} (${leg.odds.toFixed(2)})`).join(' + '),
      stake: bet.wagerAmount,
      status: status,
    };
  });

  // Sort by creation date (newest first)
  allBets.sort((a, b) => {
    const betA = MOCK_BETS.find((bet) => String(bet.id).includes(String(a.id)));
    const betB = MOCK_BETS.find((bet) => String(bet.id).includes(String(b.id)));
    if (!betA || !betB) return 0;
    return new Date(betB.createdAt).getTime() - new Date(betA.createdAt).getTime();
  });

  // Pagination
  const start = page * size;
  const end = start + size;
  const paginatedBets = allBets.slice(start, end);

  return {
    content: paginatedBets,
    totalElements: allBets.length,
    totalPages: Math.ceil(allBets.length / size),
    size,
    number: page,
    first: page === 0,
    last: end >= allBets.length,
    empty: paginatedBets.length === 0,
  };
};

/**
 * Get bet by ID (mock version)
 * Handles both "bet-1" format and numeric "1" format
 */
export const getBetById = async (id: string): Promise<MockBetSlip | null> => {
  // Try exact match first
  let bet = MOCK_BETS.find((b) => b.id === id);
  
  // If not found, try numeric match (e.g., "1" matches "bet-1")
  if (!bet && !id.startsWith('bet-')) {
    bet = MOCK_BETS.find((b) => {
      const numericId = b.id.replace('bet-', '');
      return numericId === id || String(b.id) === String(id);
    });
  }
  
  // Also try reverse (if id is "bet-1", try to find by numeric "1")
  if (!bet && id.startsWith('bet-')) {
    const numericId = id.replace('bet-', '');
    bet = MOCK_BETS.find((b) => b.id.replace('bet-', '') === numericId);
  }
  
  return bet || null;
};

/**
 * Get all mock bets (for internal use)
 */
export const getAllMockBets = (): MockBetSlip[] => {
  return [...MOCK_BETS];
};

/**
 * Clear all mock bets (for testing)
 */
export const clearMockBets = (): void => {
  MOCK_BETS = [];
  nextBetId = 1;
};

/**
 * Get current user session (includes points balance)
 */
export const getUserSession = async (): Promise<UserSession> => {
  const response = await api.get<UserSession>('/users/session');
  return response.data;
};

/**
 * Helper to create a MATCH_WINNER bet request
 */
export const createMatchWinnerBet = (
  fixtureId: number,
  selection: 'HOME' | 'DRAW' | 'AWAY'
): BetRequestDTO => ({
  fixtureId,
  marketType: MarketType.MATCH_WINNER,
  selection,
});
