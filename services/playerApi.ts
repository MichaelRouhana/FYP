import api from './api';

/**
 * Player Detailed Stats DTO matching the backend structure
 */
export interface PlayerDetailedStatsDTO {
  summary: Summary;
  attacking: Attacking;
  passing: Passing;
  defending: Defending;
  discipline: Discipline;
}

export interface Summary {
  matchesPlayed: number | null;
  minutesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  rating: string | null;
}

export interface Attacking {
  shotsTotal: number | null;
  shotsOnTarget: number | null;
  dribblesAttempted: number | null;
  dribblesSuccess: number | null;
  penaltiesScored: number | null;
  penaltiesMissed: number | null;
}

export interface Passing {
  totalPasses: number | null;
  keyPasses: number | null;
  passAccuracy: number | null; // Percentage as integer (0-100)
}

export interface Defending {
  tacklesTotal: number | null;
  interceptions: number | null;
  blocks: number | null;
  duelsTotal: number | null;
  duelsWon: number | null;
}

export interface Discipline {
  yellowCards: number | null;
  redCards: number | null;
  foulsCommitted: number | null;
  foulsDrawn: number | null;
}

/**
 * Fetch detailed player statistics
 * @param playerId The player ID
 * @param season Optional season (defaults to 2023)
 * @returns PlayerDetailedStatsDTO with comprehensive player statistics
 */
export const getPlayerStats = async (playerId: number, season: number = 2023): Promise<PlayerDetailedStatsDTO> => {
  const response = await api.get(`/player/${playerId}/stats`, {
    params: { season },
  });
  return response.data;
};

