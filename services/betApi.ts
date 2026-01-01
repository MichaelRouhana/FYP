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

/**
 * Fetch odds for a fixture from the API
 * Uses POST /bets endpoint as requested by user
 * Note: This endpoint creates a bet, but the response may contain odds information
 */
export interface OddsResponse {
  home: number;
  draw: number;
  away: number;
}

export const getOdds = async (fixtureId: number): Promise<OddsResponse | null> => {
  try {
    // As per user request: Use POST /bets to get odds
    // Try to get odds by making requests for each selection
    // Note: This will create bets, so this approach might need adjustment
    
    // First, try to get odds from the football/odds endpoint (more appropriate)
    try {
      const oddsResponse = await api.get<any>(`/football/odds`, {
        params: { fixture: fixtureId }
      });
      
      // Parse odds from response
      if (oddsResponse.data?.response && oddsResponse.data.response.length > 0) {
        const oddsData = oddsResponse.data.response[0];
        // Try to find match winner odds
        const bookmakers = oddsData.bookmakers || [];
        for (const bookmaker of bookmakers) {
          const bets = bookmaker.bets || [];
          for (const bet of bets) {
            if (bet.id === 1) { // Match Winner (1X2) bet ID
              const values = bet.values || [];
              const homeOdd = values.find((v: any) => v.value === 'Home')?.odd;
              const drawOdd = values.find((v: any) => v.value === 'Draw')?.odd;
              const awayOdd = values.find((v: any) => v.value === 'Away')?.odd;
              
              if (homeOdd && drawOdd && awayOdd) {
                console.log('[getOdds] ✅ Fetched odds from /football/odds:', { home: homeOdd, draw: drawOdd, away: awayOdd });
                return {
                  home: parseFloat(homeOdd),
                  draw: parseFloat(drawOdd),
                  away: parseFloat(awayOdd),
                };
              }
            }
          }
        }
      }
    } catch (oddsError) {
      console.log('[getOdds] /football/odds endpoint failed, trying POST /bets as requested');
    }
    
    // As per user request: Try POST /bets endpoint
    // Note: This creates a bet, so we'll only use it if the response contains odds
    // We'll make a request and check if the response has odds data
    try {
      const response = await api.post<any>('/bets', {
        fixtureId,
        marketType: MarketType.MATCH_WINNER,
        selection: 'HOME',
      });
      
      // Check if response contains odds
      if (response.data?.odds) {
        console.log('[getOdds] ✅ Fetched odds from POST /bets:', response.data.odds);
        return response.data.odds;
      }
      
      // Check if response has odd field (singular)
      if (response.data?.odd) {
        // We only have one odd, need to get all three
        // This approach won't work well, so we'll fall back
        console.warn('[getOdds] POST /bets returned single odd, not all three odds');
      }
    } catch (betError: any) {
      console.log('[getOdds] POST /bets failed:', betError.response?.data || betError.message);
    }
    
    // If both approaches fail, return null to use fallback
    console.warn('[getOdds] Could not fetch odds from API, using fallback extractOdds');
    return null;
  } catch (error: any) {
    console.error('[getOdds] Error fetching odds:', error);
    return null;
  }
};

/**
 * Place a single bet (real API)
 */
export const placeBet = async (betRequest: BetRequestDTO): Promise<BetResponseDTO> => {
  console.log('[betApi] Placing bet with request:', JSON.stringify(betRequest, null, 2));
  try {
    const response = await api.post<BetResponseDTO>('/bets', betRequest);
    console.log('[betApi] Bet placed successfully:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('[betApi] Error placing bet:', error);
    console.error('[betApi] Error response:', error.response?.data);
    console.error('[betApi] Error status:', error.response?.status);
    console.error('[betApi] Error config:', error.config);
    throw error;
  }
};

/**
 * Place multiple bets sequentially
 * Used when user selects multiple predictions (e.g., Match Winner + Over 2.5 Goals)
 * Note: Sent sequentially to avoid balance race conditions
 */
export const placeMultipleBets = async (
  requests: BetRequestDTO[]
): Promise<BetResponseDTO[]> => {
  // Send bets sequentially to avoid balance race conditions
  const results: BetResponseDTO[] = [];
  for (const req of requests) {
    const result = await placeBet(req);
    results.push(result);
  }
  return results;
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
 * Get all bets (real API)
 * Sorts by ID descending (newest first) to ensure latest bets appear first
 */
export const getAllBets = async (
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<BetViewAllDTO>> => {
  const response = await api.get<PagedResponse<BetViewAllDTO>>('/bets', {
    params: {
      page,
      size,
      sort: 'id,desc', // Sort by ID descending (newest first)
    },
  });
  return response.data;
};

/**
 * Get bet by ID (real API)
 * Note: Backend endpoint is commented out, but we'll use the pattern
 * If the endpoint is not available, we'll check mock bets as fallback
 */
export const getBetById = async (id: string | number): Promise<BetResponseDTO | null> => {
  try {
    // Try real API first
    const response = await api.get<BetResponseDTO>(`/bets/${id}`);
    return response.data;
  } catch (error: any) {
    // If API endpoint is not available, fall back to mock bets
    console.warn('[getBetById] API endpoint not available, checking mock bets');
    
    // Try exact match first
    let bet = MOCK_BETS.find((b) => b.id === String(id));
    
    // If not found, try numeric match (e.g., "1" matches "bet-1")
    if (!bet && !String(id).startsWith('bet-')) {
      bet = MOCK_BETS.find((b) => {
        const numericId = b.id.replace('bet-', '');
        return numericId === String(id) || String(b.id) === String(id);
      });
    }
    
    // Also try reverse (if id is "bet-1", try to find by numeric "1")
    if (!bet && String(id).startsWith('bet-')) {
      const numericId = String(id).replace('bet-', '');
      bet = MOCK_BETS.find((b) => b.id.replace('bet-', '') === numericId);
    }
    
    // Convert mock bet to BetResponseDTO format if found
    if (bet) {
      // Return a simplified BetResponseDTO from mock data
      return {
        id: parseInt(bet.id.replace('bet-', '')) || 0,
        fixtureId: bet.fixtureId,
        marketType: bet.legs[0]?.marketType || MarketType.MATCH_WINNER,
        selection: bet.legs[0]?.selection || '',
        stake: bet.wagerAmount,
        status: bet.status === 'Pending' ? 'PENDING' : bet.status === 'Won' ? 'WON' : 'LOST',
        // Add other required fields if needed
      } as BetResponseDTO;
    }
    
    return null;
  }
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
