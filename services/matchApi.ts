import api from './api';
import { FootballApiFixture } from '@/types/fixture';

// Football-API Forwarder Endpoints

export interface FootballApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

/**
 * Get fixture details by ID
 */
export const getFixtureDetails = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching fixture details for ID:', fixtureId);
  
  const response = await api.get<FootballApiResponse<FootballApiFixture>>(
    `/football/fixtures`,
    { params: { id: fixtureId } }
  );
  
  console.log('[matchApi] Fixture response:', response.data);
  
  // Check for API errors (rate limiting, etc.)
  if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
    const errorMessage = Object.values(response.data.errors)[0] as string;
    console.error('[matchApi] API Error:', errorMessage);
    throw new Error(errorMessage || 'API request failed');
  }
  
  // Defensive: Check if response has data
  if (!response.data || !response.data.response || response.data.response.length === 0) {
    console.error('[matchApi] No fixture data returned for ID:', fixtureId);
    throw new Error(`Match not found. Please try again later.`);
  }
  
  const fixture = response.data.response[0];
  console.log('[matchApi] Fixture loaded:', fixture?.teams?.home?.name, 'vs', fixture?.teams?.away?.name);
  
  return fixture;
};

/**
 * Get fixture lineups
 */
export const getFixtureLineups = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching lineups for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/lineups`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Lineups response:', response.data?.response?.length || 0, 'items');
  return response.data?.response || [];
};

/**
 * Get fixture statistics
 */
export const getFixtureStatistics = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching statistics for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/statistics`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Statistics response:', response.data?.response?.length || 0, 'items');
  return response.data?.response || [];
};

/**
 * Get fixture events (goals, cards, substitutions)
 */
export const getFixtureEvents = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching events for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/events`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Events response:', response.data?.response?.length || 0, 'items');
  return response.data?.response || [];
};

/**
 * Get head-to-head matches
 */
export const getHeadToHead = async (homeTeamId: number, awayTeamId: number) => {
  console.log('[matchApi] Fetching H2H for teams:', homeTeamId, 'vs', awayTeamId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/headtohead`,
    { params: { h2h: `${homeTeamId}-${awayTeamId}` } }
  );
  console.log('[matchApi] H2H response:', response.data?.response?.length || 0, 'matches');
  return response.data?.response || [];
};

/**
 * Get league standings
 */
export const getStandings = async (leagueId: number, season: number) => {
  console.log('[matchApi] Fetching standings for league:', leagueId, 'season:', season);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/standings`,
    { params: { league: leagueId, season } }
  );
  console.log('[matchApi] Standings response:', response.data?.response?.length || 0, 'items');
  return response.data?.response || [];
};

/**
 * Get match predictions
 */
export const getPredictions = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching predictions for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/predictions`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Predictions response:', response.data?.response?.length || 0, 'items');
  // Defensive: Return first item or null if empty
  return response.data?.response?.[0] || null;
};

/**
 * Get fixture players with statistics (includes ratings and photos)
 * This endpoint returns detailed player data including match ratings
 */
export const getFixturePlayers = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching player statistics for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/players`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Player stats response:', response.data?.response?.length || 0, 'teams');
  return response.data?.response || [];
};

/**
 * Get team details including full venue information (capacity, surface, image)
 * This is used as a fallback when fixture.venue doesn't have complete data
 */
export const getTeamDetails = async (teamId: number) => {
  console.log('[matchApi] Fetching team details for ID:', teamId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/teams`,
    { params: { id: teamId } }
  );
  console.log('[matchApi] Team details response:', response.data?.response?.length || 0, 'items');
  return response.data?.response?.[0] || null;
};

/**
 * Get fixture injuries
 */
export const getFixtureInjuries = async (fixtureId: string | number) => {
  console.log('[matchApi] Fetching injuries for fixture:', fixtureId);
  const response = await api.get<FootballApiResponse<any>>(
    `/football/injuries`,
    { params: { fixture: fixtureId } }
  );
  console.log('[matchApi] Injuries response:', response.data?.response?.length || 0, 'items');
  return response.data?.response || [];
};

