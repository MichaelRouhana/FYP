import api from './api';
import { 
  BetRequestDTO, 
  BetResponseDTO, 
  BetViewAllDTO, 
  PagedResponse,
  UserSession,
  MarketType
} from '@/types/bet';

/**
 * Place a new bet
 */
export const placeBet = async (betRequest: BetRequestDTO): Promise<BetResponseDTO> => {
  const response = await api.post<BetResponseDTO>('/bets', betRequest);
  return response.data;
};

/**
 * Get all user bets with pagination
 */
export const getAllBets = async (
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<BetViewAllDTO>> => {
  const response = await api.get<PagedResponse<BetViewAllDTO>>('/bets', {
    params: { page, size }
  });
  return response.data;
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

