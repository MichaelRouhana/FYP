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

