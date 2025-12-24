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
  
  // Defensive: Check if response has data
  if (!response.data || !response.data.response || response.data.response.length === 0) {
    console.error('[matchApi] No fixture data returned for ID:', fixtureId);
    throw new Error(`No fixture data found for ID: ${fixtureId}`);
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
  console.log('[matchApi] Lineups response:', response.data?.response?.length, 'items');
  return response.data.response;
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
  console.log('[matchApi] Statistics response:', response.data?.response?.length, 'items');
  return response.data.response;
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
  console.log('[matchApi] Events response:', response.data?.response?.length, 'items');
  return response.data.response;
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
  console.log('[matchApi] H2H response:', response.data?.response?.length, 'matches');
  return response.data.response;
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
  console.log('[matchApi] Standings response:', response.data?.response?.length, 'items');
  return response.data.response;
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
  console.log('[matchApi] Predictions response:', response.data?.response ? 'success' : 'empty');
  return response.data.response[0];
};

