import { useState, useEffect } from 'react';
import {
  getFixtureDetails,
  getFixtureLineups,
  getFixtureStatistics,
  getFixtureEvents,
  getHeadToHead,
  getStandings,
  getPredictions,
} from '@/services/matchApi';
import { FootballApiFixture } from '@/types/fixture';

interface UseMatchDataReturn {
  loading: boolean;
  error: string | null;
  matchData: FootballApiFixture | null;
  lineups: any | null;
  stats: any | null;
  events: any | null;
  h2h: any | null;
  standings: any | null;
  predictions: any | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all match-related data from the API
 * @param fixtureId - The ID of the fixture to fetch data for
 * @returns Match data, loading state, and error state
 */
export const useMatchData = (fixtureId: string): UseMatchDataReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<FootballApiFixture | null>(null);
  const [lineups, setLineups] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [events, setEvents] = useState<any | null>(null);
  const [h2h, setH2h] = useState<any | null>(null);
  const [standings, setStandings] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any | null>(null);

  const fetchData = async () => {
    if (!fixtureId) {
      setError('No fixture ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch main fixture data first
      const fixture = await getFixtureDetails(fixtureId);
      setMatchData(fixture);

      // Extract team and league IDs for subsequent calls
      const homeTeamId = fixture.teams.home.id;
      const awayTeamId = fixture.teams.away.id;
      const leagueId = fixture.league.id;
      const season = fixture.league.season;

      // Fetch all other data in parallel
      const [lineupsData, statsData, eventsData, h2hData, standingsData, predictionsData] =
        await Promise.allSettled([
          getFixtureLineups(fixtureId),
          getFixtureStatistics(fixtureId),
          getFixtureEvents(fixtureId),
          getHeadToHead(homeTeamId, awayTeamId),
          getStandings(leagueId, season),
          getPredictions(fixtureId),
        ]);

      // Set data from settled promises
      if (lineupsData.status === 'fulfilled') setLineups(lineupsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (eventsData.status === 'fulfilled') setEvents(eventsData.value);
      if (h2hData.status === 'fulfilled') setH2h(h2hData.value);
      if (standingsData.status === 'fulfilled') setStandings(standingsData.value);
      if (predictionsData.status === 'fulfilled') setPredictions(predictionsData.value);
    } catch (err: any) {
      console.error('Error fetching match data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch match data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  return {
    loading,
    error,
    matchData,
    lineups,
    stats,
    events,
    h2h,
    standings,
    predictions,
    refetch: fetchData,
  };
};

