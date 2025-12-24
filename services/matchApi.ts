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
  const response = await api.get<FootballApiResponse<FootballApiFixture>>(
    `/football/fixtures`,
    { params: { id: fixtureId } }
  );
  return response.data.response[0]; // Return first result
};

/**
 * Get fixture lineups
 */
export const getFixtureLineups = async (fixtureId: string | number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/lineups`,
    { params: { fixture: fixtureId } }
  );
  return response.data.response;
};

/**
 * Get fixture statistics
 */
export const getFixtureStatistics = async (fixtureId: string | number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/statistics`,
    { params: { fixture: fixtureId } }
  );
  return response.data.response;
};

/**
 * Get fixture events (goals, cards, substitutions)
 */
export const getFixtureEvents = async (fixtureId: string | number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/events`,
    { params: { fixture: fixtureId } }
  );
  return response.data.response;
};

/**
 * Get head-to-head matches
 */
export const getHeadToHead = async (homeTeamId: number, awayTeamId: number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/headtohead`,
    { params: { h2h: `${homeTeamId}-${awayTeamId}` } }
  );
  return response.data.response;
};

/**
 * Get league standings
 */
export const getStandings = async (leagueId: number, season: number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/standings`,
    { params: { league: leagueId, season } }
  );
  return response.data.response;
};

/**
 * Get match predictions
 */
export const getPredictions = async (fixtureId: string | number) => {
  const response = await api.get<FootballApiResponse<any>>(
    `/football/fixtures/predictions`,
    { params: { fixture: fixtureId } }
  );
  return response.data.response[0];
};

