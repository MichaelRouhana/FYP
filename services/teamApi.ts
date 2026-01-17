import api from './api';

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
  // Summary
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  cleanSheets: number;
  
  // Attacking
  goalsScored: number;
  goalsPerMatch: string;
  shots: number;
  shotsOnTarget: number;
  penaltiesScored: number;
  
  // Passing
  passes: number;
  passesAccurate: number;
  passAccuracy: string;
  
  // Defending
  goalsConceded: number;
  goalsConcededPerMatch: string;
  tackles: number;
  interceptions: number;
  saves: number;
  
  // Other
  yellowCards: number;
  redCards: number;
  fouls: number;
}

/**
 * Fetch team statistics
 * @param teamId The team ID
 * @param leagueId The league ID (optional - if null, backend will auto-detect)
 * @returns TeamStatsDTO with team statistics
 */
export const getTeamStats = async (teamId: number, leagueId: number | null = null): Promise<TeamStatsDTO> => {
  const params: any = {};
  if (leagueId !== null) {
    params.leagueId = leagueId;
  }
  const response = await api.get(`/team/${teamId}/statistics`, {
    params,
  });
  return response.data;
};

