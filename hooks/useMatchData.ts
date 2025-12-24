import { useState, useEffect } from 'react';
import {
  getFixtureDetails,
  getFixtureLineups,
  getFixtureStatistics,
  getFixtureEvents,
  getHeadToHead,
  getStandings,
  getPredictions,
  getFixturePlayers,
  getTeamDetails,
} from '@/services/matchApi';
import { FootballApiFixture } from '@/types/fixture';

interface UseMatchDataReturn {
  loading: boolean;
  error: string | null;
  matchData: FootballApiFixture | null;
  lineups: any | null;
  playerStats: any | null; // Player statistics with ratings and photos
  homeTeamVenue: any | null; // Home team venue details (capacity, surface)
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
  const [playerStats, setPlayerStats] = useState<any | null>(null);
  const [homeTeamVenue, setHomeTeamVenue] = useState<any | null>(null);
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

      console.log('[useMatchData] Fetching fixture details for ID:', fixtureId);

      // Fetch main fixture data first
      const fixture = await getFixtureDetails(fixtureId);
      
      // DEFENSIVE: Check if fixture data is valid
      if (!fixture || !fixture.teams || !fixture.league) {
        console.error('[useMatchData] Invalid fixture data returned:', fixture);
        setError('Failed to load match data - invalid response from server');
        setLoading(false);
        return;
      }

      console.log('[useMatchData] Fixture loaded successfully:', fixture.teams.home.name, 'vs', fixture.teams.away.name);
      setMatchData(fixture);

      // Extract team and league IDs for subsequent calls (with defensive checks)
      const homeTeamId = fixture.teams?.home?.id;
      const awayTeamId = fixture.teams?.away?.id;
      const leagueId = fixture.league?.id;
      const season = fixture.league?.season;

      // Validate required IDs
      if (!homeTeamId || !awayTeamId || !leagueId || !season) {
        console.warn('[useMatchData] Some IDs are missing, fetching available data only');
      }

      // Fetch all other data in parallel
      console.log('[useMatchData] Fetching additional data for fixture:', fixtureId);
      console.log('[useMatchData] Home team ID:', homeTeamId, 'Away team ID:', awayTeamId);
      console.log('[useMatchData] League ID:', leagueId, 'Season:', season);

      // Build promises array based on what IDs we have
      const promises: Promise<any>[] = [
        getFixtureLineups(fixtureId),
        getFixtureStatistics(fixtureId),
        getFixtureEvents(fixtureId),
        getFixturePlayers(fixtureId), // Player stats with ratings and photos
      ];

      // Fetch home team details for complete venue info (capacity, surface)
      if (homeTeamId) {
        promises.push(getTeamDetails(homeTeamId));
      } else {
        promises.push(Promise.resolve(null));
      }

      // Only fetch H2H if we have both team IDs
      if (homeTeamId && awayTeamId) {
        promises.push(getHeadToHead(homeTeamId, awayTeamId));
      } else {
        promises.push(Promise.resolve(null));
      }

      // Only fetch standings if we have league info
      if (leagueId && season) {
        promises.push(getStandings(leagueId, season));
      } else {
        promises.push(Promise.resolve(null));
      }

      promises.push(getPredictions(fixtureId));

      const [lineupsData, statsData, eventsData, playerStatsData, homeTeamData, h2hData, standingsData, predictionsData] =
        await Promise.allSettled(promises);

      // Log results of each API call
      console.log('[useMatchData] Lineups:', lineupsData.status, lineupsData.status === 'fulfilled' ? `${lineupsData.value?.length || 0} items` : lineupsData.reason?.message);
      console.log('[useMatchData] Stats:', statsData.status, statsData.status === 'fulfilled' ? `${statsData.value?.length || 0} items` : statsData.reason?.message);
      console.log('[useMatchData] Events:', eventsData.status, eventsData.status === 'fulfilled' ? `${eventsData.value?.length || 0} items` : eventsData.reason?.message);
      console.log('[useMatchData] PlayerStats:', playerStatsData.status, playerStatsData.status === 'fulfilled' ? `${playerStatsData.value?.length || 0} teams` : playerStatsData.reason?.message);
      console.log('[useMatchData] HomeTeam:', homeTeamData.status, homeTeamData.status === 'fulfilled' ? (homeTeamData.value?.venue ? 'has venue' : 'no venue') : homeTeamData.reason?.message);
      console.log('[useMatchData] H2H:', h2hData.status, h2hData.status === 'fulfilled' ? `${h2hData.value?.length || 0} items` : h2hData.reason?.message);
      console.log('[useMatchData] Standings:', standingsData.status, standingsData.status === 'fulfilled' ? 'success' : standingsData.reason?.message);
      console.log('[useMatchData] Predictions:', predictionsData.status, predictionsData.status === 'fulfilled' ? 'success' : predictionsData.reason?.message);

      // Set data from settled promises
      if (lineupsData.status === 'fulfilled') setLineups(lineupsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (eventsData.status === 'fulfilled') setEvents(eventsData.value);
      if (playerStatsData.status === 'fulfilled') setPlayerStats(playerStatsData.value);
      if (homeTeamData.status === 'fulfilled') setHomeTeamVenue(homeTeamData.value?.venue || null);
      if (h2hData.status === 'fulfilled') setH2h(h2hData.value);
      if (standingsData.status === 'fulfilled') setStandings(standingsData.value);
      if (predictionsData.status === 'fulfilled') setPredictions(predictionsData.value);
    } catch (err: any) {
      console.error('[useMatchData] Error fetching match data:', err);
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
    playerStats,
    homeTeamVenue,
    stats,
    events,
    h2h,
    standings,
    predictions,
    refetch: fetchData,
  };
};

