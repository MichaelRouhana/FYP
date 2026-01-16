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
  description?: string;
}

/**
 * Fetch team details including stadium information
 * @param teamId The team ID
 * @returns TeamDetailsDTO with stadium details, city, capacity, and founded year
 */
export const getTeamDetails = async (teamId: number): Promise<TeamDetailsDTO> => {
  try {
    const response = await api.get<TeamDetailsDTO>(`/team/${teamId}/details`);
    return response.data;
  } catch (error: any) {
    console.error('[teamApi] Error fetching team details:', error);
    throw error;
  }
};

