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
 * Fetch team details including stadium information
 * @param teamId The team ID
 * @returns TeamDetailsDTO with stadium details, city, capacity, and founded year
 */
export const getTeamDetails = async (teamId: number): Promise<TeamDetailsDTO> => {
  const response = await api.get(`/team/${teamId}/details`);
  return response.data;
};

