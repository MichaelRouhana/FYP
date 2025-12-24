/**
 * Utility functions to map Football-API responses to UI formats
 */

import { FootballApiFixture } from '@/types/fixture';
import { MatchLineups, TeamLineup, Player } from '@/mock/matchLineups';
import { MatchStats, StatItem } from '@/mock/matchStats';
import { H2HData, H2HMatch, H2HStats } from '@/mock/matchH2H';
import { MatchSummary, MatchEvent, EventType, TeamSide } from '@/mock/matchSummary';
import { TeamStanding } from '@/mock/matchTable';

/**
 * Map lineups API response to UI format
 */
export const mapLineupsToUI = (lineupsData: any[], matchData: FootballApiFixture): MatchLineups | null => {
  if (!lineupsData || lineupsData.length < 2) {
    console.log('[matchDataMapper] Insufficient lineup data:', lineupsData?.length);
    return null;
  }

  const homeLineup = lineupsData.find(l => l.team.id === matchData.teams.home.id);
  const awayLineup = lineupsData.find(l => l.team.id === matchData.teams.away.id);

  if (!homeLineup || !awayLineup) {
    console.log('[matchDataMapper] Missing lineup for home or away team');
    return null;
  }

  const mapTeamLineup = (lineup: any, teamName: string): TeamLineup => {
    const starters = {
      goalkeeper: [] as Player[],
      defenders: [] as Player[],
      midfielders: [] as Player[],
      forwards: [] as Player[],
    };

    const substitutes: Player[] = [];

    lineup.startXI?.forEach((player: any) => {
      const mappedPlayer: Player = {
        id: player.player.id.toString(),
        name: player.player.name,
        number: player.player.number,
        position: player.player.pos,
        rating: 0, // Rating not available in lineup endpoint
        photo: player.player.photo,
      };

      // Categorize by position
      const pos = player.player.pos?.toUpperCase();
      if (pos === 'G') {
        starters.goalkeeper.push(mappedPlayer);
      } else if (pos === 'D') {
        starters.defenders.push(mappedPlayer);
      } else if (pos === 'M') {
        starters.midfielders.push(mappedPlayer);
      } else if (pos === 'F') {
        starters.forwards.push(mappedPlayer);
      }
    });

    lineup.substitutes?.forEach((player: any) => {
      substitutes.push({
        id: player.player.id.toString(),
        name: player.player.name,
        number: player.player.number,
        position: player.player.pos,
        rating: 0,
        photo: player.player.photo,
      });
    });

    return {
      teamId: lineup.team.id.toString(),
      teamName: teamName,
      teamLogo: lineup.team.logo,
      formation: lineup.formation || 'N/A',
      teamRating: 0, // Not available
      starters,
      substitutes,
    };
  };

  return {
    matchId: matchData.fixture.id.toString(),
    homeTeam: mapTeamLineup(homeLineup, matchData.teams.home.name),
    awayTeam: mapTeamLineup(awayLineup, matchData.teams.away.name),
  };
};

/**
 * Map statistics API response to UI format
 */
export const mapStatsToUI = (statsData: any[]): MatchStats | null => {
  if (!statsData || statsData.length < 2) {
    console.log('[matchDataMapper] Insufficient stats data:', statsData?.length);
    return null;
  }

  const homeStats = statsData[0]?.statistics || [];
  const awayStats = statsData[1]?.statistics || [];

  const getStatValue = (stats: any[], type: string): number => {
    const stat = stats.find((s: any) => s.type === type);
    if (!stat || stat.value === null) return 0;
    if (typeof stat.value === 'string') {
      return parseInt(stat.value.replace('%', '')) || 0;
    }
    return stat.value;
  };

  const createStatItem = (name: string, type: string): StatItem => ({
    name,
    homeValue: getStatValue(homeStats, type),
    awayValue: getStatValue(awayStats, type),
  });

  const topStats: StatItem[] = [
    createStatItem('Shots on Goal', 'Shots on Goal'),
    createStatItem('Shots off Goal', 'Shots off Goal'),
    createStatItem('Total Shots', 'Total Shots'),
    createStatItem('Blocked Shots', 'Blocked Shots'),
    createStatItem('Corner Kicks', 'Corner Kicks'),
  ];

  const shots: StatItem[] = [
    createStatItem('Shots Inside Box', 'Shots insidebox'),
    createStatItem('Shots Outside Box', 'Shots outsidebox'),
    createStatItem('Total Shots', 'Total Shots'),
    createStatItem('Fouls', 'Fouls'),
    createStatItem('Offsides', 'Offsides'),
  ];

  const disciplines: StatItem[] = [
    createStatItem('Yellow Cards', 'Yellow Cards'),
    createStatItem('Red Cards', 'Red Cards'),
  ];

  return {
    matchId: statsData[0]?.team?.id?.toString() || 'unknown',
    possession: {
      home: getStatValue(homeStats, 'Ball Possession'),
      away: getStatValue(awayStats, 'Ball Possession'),
    },
    topStats,
    shots,
    disciplines,
  };
};

/**
 * Map events API response to UI format
 */
export const mapEventsToUI = (eventsData: any[], matchData: FootballApiFixture): MatchSummary | null => {
  if (!eventsData) return null;

  const mapEventType = (type: string, detail: string): EventType => {
    const typeMap: { [key: string]: EventType } = {
      'Goal': 'goal',
      'Card': detail === 'Yellow Card' ? 'yellow_card' : detail === 'Red Card' ? 'red_card' : 'two_yellow_card',
      'subst': 'substitution',
    };
    return typeMap[type] || 'goal';
  };

  const events: MatchEvent[] = eventsData.map((event: any, index: number) => ({
    id: `e${index + 1}`,
    type: mapEventType(event.type, event.detail),
    time: `${event.time.elapsed}${event.time.extra ? `+${event.time.extra}` : ''}'`,
    team: event.team.id === matchData.teams.home.id ? 'home' as TeamSide : 'away' as TeamSide,
    playerName: event.player.name,
    playerOut: event.assist?.name,
    score: event.type === 'Goal' ? `${event.team.id === matchData.teams.home.id ? matchData.goals.home : matchData.goals.away}-${event.team.id === matchData.teams.away.id ? matchData.goals.away : matchData.goals.home}` : undefined,
  }));

  return {
    matchId: matchData.fixture.id.toString(),
    halftimeScore: `${matchData.score.halftime.home || 0}-${matchData.score.halftime.away || 0}`,
    fulltimeScore: `${matchData.score.fulltime.home || 0}-${matchData.score.fulltime.away || 0}`,
    events,
  };
};

/**
 * Map H2H API response to UI format
 */
export const mapH2HToUI = (h2hData: any[], homeTeamName: string, awayTeamName: string): H2HData | null => {
  if (!h2hData || h2hData.length === 0) return null;

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  const matches: H2HMatch[] = h2hData.map((match: any, index: number) => {
    const isCompleted = match.fixture.status.short === 'FT';
    const homeScore = match.goals.home;
    const awayScore = match.goals.away;

    if (isCompleted) {
      if (homeScore > awayScore) homeWins++;
      else if (homeScore < awayScore) awayWins++;
      else draws++;
    }

    return {
      id: `h2h-${index + 1}`,
      date: new Date(match.fixture.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeScore: isCompleted ? homeScore : undefined,
      awayScore: isCompleted ? awayScore : undefined,
      time: !isCompleted ? new Date(match.fixture.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) : undefined,
      isCompleted,
    };
  });

  const stats: H2HStats = {
    homeWins,
    draws,
    awayWins,
  };

  return {
    matchId: 'current',
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    stats,
    matches,
  };
};

/**
 * Map standings API response to UI format
 */
export const mapStandingsToUI = (standingsData: any[]): TeamStanding[] => {
  console.log('[matchDataMapper] Mapping standings data:', standingsData);
  
  if (!standingsData || standingsData.length === 0) {
    console.log('[matchDataMapper] No standings data provided');
    return [];
  }

  console.log('[matchDataMapper] Standings data structure:', JSON.stringify(standingsData[0], null, 2).substring(0, 500));

  const standings = standingsData[0]?.league?.standings?.[0];
  if (!standings) {
    console.log('[matchDataMapper] No standings array found in data');
    return [];
  }

  console.log('[matchDataMapper] Found', standings.length, 'teams in standings');

  return standings.map((team: any) => ({
    position: team.rank,
    teamName: team.team.name,
    teamLogo: team.team.logo,
    played: team.all.played,
    won: team.all.win,
    drawn: team.all.draw,
    lost: team.all.lose,
    goalsFor: team.all.goals.for,
    goalsAgainst: team.all.goals.against,
    goalDifference: team.goalsDiff,
    points: team.points,
    form: team.form?.split('').slice(0, 5) || [],
  }));
};

/**
 * Extract venue and weather info from predictions
 */
export const extractVenueAndWeather = (predictionsData: any, matchData: FootballApiFixture) => {
  // Try to extract venue capacity and surface from fixture data
  const capacity = matchData.fixture.venue?.capacity 
    ? `${matchData.fixture.venue.capacity.toLocaleString()} seats`
    : 'N/A';
  const surface = matchData.fixture.venue?.surface || 'N/A';

  // Try to extract weather from predictions (if available)
  let condition = 'N/A';
  let temperature = 'N/A';

  // Weather data might be in predictions.forecast or predictions.weather
  if (predictionsData) {
    console.log('[matchDataMapper] Predictions data available, checking for weather...');
    const forecast = predictionsData.forecast;
    const weather = predictionsData.weather;
    
    if (weather) {
      console.log('[matchDataMapper] Weather data found:', weather);
      condition = weather.condition || weather.description || 'N/A';
      temperature = weather.temperature ? `${weather.temperature}°C` : 'N/A';
    } else if (forecast) {
      console.log('[matchDataMapper] Forecast data found:', forecast);
      condition = forecast.condition || 'N/A';
      temperature = forecast.temperature ? `${forecast.temperature}°C` : 'N/A';
    } else {
      console.log('[matchDataMapper] No weather/forecast data in predictions');
    }
  } else {
    console.log('[matchDataMapper] No predictions data available');
  }

  return {
    venue: {
      name: matchData.fixture.venue.name || 'Unknown Venue',
      location: matchData.fixture.venue.city || 'Unknown City',
      capacity,
      surface,
    },
    weather: {
      condition,
      temperature,
    },
  };
};

/**
 * Extract odds from predictions
 */
export const extractOdds = (predictionsData: any) => {
  // Try multiple possible data structures from Football-API
  
  console.log('[matchDataMapper] Extracting odds from predictions...');
  
  // Structure 1: predictions.bookmakers (from predictions endpoint)
  const bookmakers = predictionsData?.bookmakers || predictionsData?.predictions?.[0]?.bookmakers || [];
  
  if (bookmakers.length > 0) {
    console.log('[matchDataMapper] Found bookmakers data:', bookmakers.length);
    // Find Match Winner bet
    const matchWinner = bookmakers[0].bets?.find((bet: any) => 
      bet.name === 'Match Winner' || bet.name === 'Match Winner (1X2)'
    );
    
    if (matchWinner?.values) {
      const homeOdd = matchWinner.values.find((v: any) => v.value === 'Home')?.odd;
      const drawOdd = matchWinner.values.find((v: any) => v.value === 'Draw')?.odd;
      const awayOdd = matchWinner.values.find((v: any) => v.value === 'Away')?.odd;

      if (homeOdd && drawOdd && awayOdd) {
        return {
          home: parseFloat(homeOdd),
          draw: parseFloat(drawOdd),
          away: parseFloat(awayOdd),
        };
      }
    }
  }

  // Structure 2: predictions.comparison (from predictions endpoint)
  const comparison = predictionsData?.predictions?.comparison;
  if (comparison) {
    const form = comparison.form;
    const att = comparison.att;
    const def = comparison.def;
    
    if (form && att && def) {
      // Calculate approximate odds from form/attack/defense ratings
      const homeStrength = (parseFloat(form.home) + parseFloat(att.home) + parseFloat(def.home)) / 3;
      const awayStrength = (parseFloat(form.away) + parseFloat(att.away) + parseFloat(def.away)) / 3;
      
      const total = homeStrength + awayStrength;
      const homeProb = homeStrength / total;
      const awayProb = awayStrength / total;
      
      return {
        home: Number((1 / homeProb * 0.9).toFixed(2)), // 0.9 is house edge
        draw: 3.40, // Default draw odds
        away: Number((1 / awayProb * 0.9).toFixed(2)),
      };
    }
  }

  // Default odds if not available
  return {
    home: 1.85,
    draw: 3.40,
    away: 2.10,
  };
};

