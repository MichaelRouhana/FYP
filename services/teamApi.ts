import api from './api';
import { TeamStats } from '@/types/team';

/**
 * Team Details DTO matching the backend structure
 */
export interface TeamDetailsDTO {
  stadiumName: string;
  stadiumImage: string;
  city: string;
  capacity: number;
  foundedYear: number;
}

/**
 * Team Header DTO matching the backend structure
 */
export interface TeamHeader {
  name: string;
  logo: string;
  foundedYear: number;
  country: string;
  stadiumName: string;
  coachName: string;
  coachImageUrl: string;
  uefaRanking: number;
}

/**
 * Trophy DTO matching the backend structure
 */
export interface Trophy {
  leagueName: string;
  season: string;
  isMajor: boolean;
}

/**
 * Fetch team details including stadium information
 * @param teamId The team ID
 * @returns TeamDetailsDTO with stadium details, city, capacity, and founded year
 */
export const getTeamDetails = async (teamId: number): Promise<TeamDetailsDTO> => {
  const response = await api.get(`/team/${teamId}/details`);
  return response.data;
};

/**
 * Fetch team header information
 * @param teamId The team ID
 * @returns TeamHeader with name, logo, foundedYear, country, stadiumName, coachName, coachImageUrl, and uefaRanking
 */
export const getTeamHeader = async (teamId: number): Promise<TeamHeader> => {
  const response = await api.get(`/team/${teamId}/header`);
  return response.data;
};

/**
 * Fetch team trophies
 * @param teamId The team ID
 * @returns Array of Trophy objects with leagueName, season, and isMajor
 */
export const getTrophies = async (teamId: number): Promise<Trophy[]> => {
  const response = await api.get(`/team/${teamId}/trophies`);
  return response.data;
};

/**
 * Squad Member DTO matching the backend structure
 */
export interface SquadMemberDTO {
  id: number;
  name: string;
  photoUrl: string;
  position: string; // GK, DEF, MID, FWD
  age?: number;
  height?: number;
  marketValue?: string;
  contractUntil?: string;
  previousClub?: string;
  number?: number; // Jersey number - may not be available yet from backend
  nationality?: string; // Player nationality
  nationalityFlag?: string; // Flag URL or emoji
  injured?: boolean; // Injury status
  injuryReason?: string; // Injury reason/description
}

/**
 * Fetch team squad
 * @param teamId The team ID
 * @returns Array of SquadMemberDTO objects
 */
export const getSquad = async (teamId: number): Promise<SquadMemberDTO[]> => {
  const response = await api.get(`/team/${teamId}/squad`);
  return response.data;
};

/**
 * Team Stats DTO matching the backend structure
 */
export interface TeamStatsDTO {
  summary: Summary;
  attacking: Attacking;
  passing: Passing;
  defending: Defending;
  other: Other;
}

export interface Summary {
  played: number;
  wins: number;
  draws: number;
  loses: number;
  form: string;
}

export interface Attacking {
  goalsScored: number;
  penaltiesScored: number;
  penaltiesMissed: number;
  shotsOnGoal: number;
  shotsOffGoal: number;
  totalShots: number;
}

export interface Passing {
  totalPasses: number;
  passesAccurate: number;
  passAccuracyPercentage: number;
}

export interface Defending {
  goalsConceded: number;
  cleanSheets: number;
  saves: number;
  tackles: number;
  interceptions: number;
}

export interface Other {
  yellowCards: number;
  redCards: number;
  fouls: number;
  corners: number;
  offsides: number;
}

/**
 * Fetch team statistics
 * @param teamId The team ID
 * @param leagueId The league ID (default: 140 for La Liga)
 * @returns TeamStatsDTO with team statistics
 */
export const getTeamStats = async (teamId: number, leagueId: number = 140): Promise<TeamStatsDTO> => {
  const response = await api.get(`/team/${teamId}/statistics`, {
    params: { leagueId },
  });
  return response.data;
};

/**
 * Fetch team statistics with optional league and season parameters
 * @param teamId The team ID
 * @param leagueId Optional league ID (defaults to backend default if not provided)
 * @param season Optional season year (defaults to current season if not provided)
 * @returns TeamStats with team statistics
 */
export const fetchTeamStats = async (
  teamId: number, 
  leagueId?: number, 
  season?: number
): Promise<TeamStats> => {
  try {
    const params: any = {};
    if (leagueId !== undefined) {
      params.leagueId = leagueId;
    }
    if (season !== undefined) {
      params.season = season;
    }
    
    const response = await api.get(`/team/${teamId}/statistics`, { params });
    console.log('Team Stats API Response:', JSON.stringify(response.data, null, 2));
    return response.data as TeamStats;
  } catch (error: any) {
    console.error('Error fetching team stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch team statistics');
  }
};

