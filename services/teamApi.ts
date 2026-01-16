import api from './api';

// Types matching backend DTOs
export interface TeamHeaderDTO {
  name: string;
  logo: string;
  foundedYear: number;
  country: string;
  stadiumName: string;
  coachName: string;
  coachImageUrl?: string;
  uefaRanking?: number;
}

export interface SquadMemberDTO {
  id: number;
  name: string;
  photoUrl?: string;
  position: string; // GK, DEF, MID, FWD
  age: number;
  height?: number;
  marketValue?: string;
  contractUntil?: string;
  previousClub?: string;
}

export interface TeamStatsDTO {
  matchesPlayed: number;
  goalsScored: number;
  goalsPerGame: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
}

export interface TrophyDTO {
  leagueName: string;
  season: number;
  isMajor: boolean;
}

export interface StandingRow {
  rank: number;
  team: string;
  teamLogo?: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
  isCurrent?: boolean;
}

/**
 * Get team header information
 * @param teamId Team ID
 * @returns TeamHeaderDTO
 */
export const getTeamHeader = async (teamId: number): Promise<TeamHeaderDTO> => {
  try {
    const response = await api.get(`/teams/${teamId}/header`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team header:', error);
    throw error;
  }
};

/**
 * Get team squad
 * @param teamId Team ID
 * @returns List of SquadMemberDTO
 */
export const getTeamSquad = async (teamId: number): Promise<SquadMemberDTO[]> => {
  try {
    const response = await api.get(`/teams/${teamId}/squad`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching team squad:', error);
    return [];
  }
};

/**
 * Get team statistics for a specific league
 * @param teamId Team ID
 * @param leagueId League ID
 * @returns TeamStatsDTO
 */
export const getTeamStatistics = async (teamId: number, leagueId: number): Promise<TeamStatsDTO | null> => {
  try {
    const response = await api.get(`/teams/${teamId}/statistics`, {
      params: { leagueId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    return null;
  }
};

/**
 * Get team trophies
 * @param teamId Team ID
 * @returns List of TrophyDTO
 */
export const getTeamTrophies = async (teamId: number): Promise<TrophyDTO[]> => {
  try {
    const response = await api.get(`/teams/${teamId}/trophies`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching team trophies:', error);
    return [];
  }
};

/**
 * Get team standings
 * Note: This endpoint may need to be implemented in the backend
 * For now, this is a placeholder that can be connected to a standings endpoint
 * @param teamId Team ID
 * @param leagueId Optional league ID
 * @returns List of StandingRow
 */
export const getTeamStandings = async (teamId: number, leagueId?: number): Promise<StandingRow[]> => {
  try {
    // TODO: Update this endpoint when standings endpoint is available
    // For now, return empty array to prevent crashes
    // Example: const response = await api.get(`/teams/${teamId}/standings`, { params: { leagueId } });
    // return Array.isArray(response.data) ? response.data : [];
    
    console.warn('Standings endpoint not yet implemented in backend');
    return [];
  } catch (error) {
    console.error('Error fetching team standings:', error);
    return [];
  }
};

