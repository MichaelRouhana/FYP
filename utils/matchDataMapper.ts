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
 * @param lineupsData - Raw lineups from /fixtures/lineups endpoint
 * @param matchData - Main fixture data
 * @param playerStatsData - Player statistics from /fixtures/players endpoint (has ratings and photos)
 */
export const mapLineupsToUI = (lineupsData: any[], matchData: FootballApiFixture, playerStatsData?: any[]): MatchLineups | null => {
  console.log('[matchDataMapper] Mapping lineups, received:', lineupsData?.length, 'teams');
  console.log('[matchDataMapper] Player stats available:', playerStatsData?.length || 0, 'teams');
  
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

  // Build a lookup map for player stats (id -> { rating, photo })
  const playerStatsMap = new Map<number, { rating: number; photo: string | null }>();
  
  if (playerStatsData && playerStatsData.length > 0) {
    playerStatsData.forEach((teamData: any) => {
      teamData.players?.forEach((playerData: any) => {
        const playerId = playerData.player?.id;
        if (playerId) {
          const ratingStr = playerData.statistics?.[0]?.games?.rating;
          const rating = ratingStr ? parseFloat(ratingStr) : 0;
          const photo = playerData.player?.photo || null;
          playerStatsMap.set(playerId, { rating: isNaN(rating) ? 0 : rating, photo });
        }
      });
    });
    console.log('[matchDataMapper] Built player stats map with', playerStatsMap.size, 'players');
  }

  // Log a sample player to see the structure
  if (homeLineup.startXI && homeLineup.startXI.length > 0) {
    console.log('[matchDataMapper] Sample lineup player data:', JSON.stringify(homeLineup.startXI[0], null, 2));
  }

  const mapTeamLineup = (lineup: any, teamName: string): TeamLineup => {
    const starters = {
      goalkeeper: [] as Player[],
      defenders: [] as Player[],
      midfielders: [] as Player[],
      forwards: [] as Player[],
    };

    const substitutes: Player[] = [];

    // Helper to get player stats (rating and photo) from the playerStatsMap
    const getPlayerStats = (playerId: number) => {
      return playerStatsMap.get(playerId) || { rating: 0, photo: null };
    };

    lineup.startXI?.forEach((playerData: any) => {
      // Defensive: Skip if player data is missing
      if (!playerData?.player) {
        console.warn('[matchDataMapper] Missing player data in startXI:', playerData);
        return;
      }

      const player = playerData.player;
      const playerId = player.id;
      
      // Get rating and photo from player stats (fixtures/players endpoint)
      const playerStatsInfo = getPlayerStats(playerId);
      
      // DEBUG: Log first player's full structure to understand API response
      if (starters.goalkeeper.length === 0 && starters.defenders.length === 0) {
        console.log('[matchDataMapper] Sample player structure:', JSON.stringify(playerData, null, 2));
        console.log('[matchDataMapper] Player stats from map:', playerStatsInfo);
      }
      
      const mappedPlayer: Player = {
        id: player.id?.toString() || `player-${Math.random()}`,
        name: player.name || 'Unknown',
        number: player.number || 0,
        position: player.pos || 'U', // U = Unknown
        rating: playerStatsInfo.rating, // From fixtures/players endpoint
        photo: playerStatsInfo.photo, // From fixtures/players endpoint
      };

      // Categorize by position - with fallback if pos is missing
      const pos = (player.pos || 'M')?.toUpperCase(); // Default to midfield
      if (pos === 'G') {
        starters.goalkeeper.push(mappedPlayer);
      } else if (pos === 'D') {
        starters.defenders.push(mappedPlayer);
      } else if (pos === 'M') {
        starters.midfielders.push(mappedPlayer);
      } else if (pos === 'F') {
        starters.forwards.push(mappedPlayer);
      } else {
        // Unknown position - put in midfield
        starters.midfielders.push(mappedPlayer);
      }
    });

    lineup.substitutes?.forEach((playerData: any) => {
      // Defensive: Skip if player data is missing
      if (!playerData?.player) {
        console.warn('[matchDataMapper] Missing player data in substitutes:', playerData);
        return;
      }

      const player = playerData.player;
      const playerId = player.id;
      const playerStatsInfo = getPlayerStats(playerId);
      
      substitutes.push({
        id: player.id?.toString() || `sub-${Math.random()}`,
        name: player.name || 'Unknown',
        number: player.number || 0,
        position: player.pos || 'SUB',
        rating: playerStatsInfo.rating, // From fixtures/players endpoint
        photo: playerStatsInfo.photo, // From fixtures/players endpoint
      });
    });

    const result = {
      teamId: lineup.team?.id?.toString() || 'unknown',
      teamName: teamName,
      teamLogo: lineup.team?.logo || null,
      formation: lineup.formation || 'N/A',
      teamRating: 0, // Not available
      starters,
      substitutes,
    };

    // Log counts
    const totalStarters = starters.goalkeeper.length + starters.defenders.length + 
                         starters.midfielders.length + starters.forwards.length;
    console.log(`[matchDataMapper] ${teamName}: ${totalStarters} starters, ${substitutes.length} subs`);
    console.log(`[matchDataMapper] Formation breakdown - GK:${starters.goalkeeper.length}, D:${starters.defenders.length}, M:${starters.midfielders.length}, F:${starters.forwards.length}`);

    return result;
  };

  const lineups = {
    matchId: matchData.fixture.id.toString(),
    homeTeam: mapTeamLineup(homeLineup, matchData.teams.home.name),
    awayTeam: mapTeamLineup(awayLineup, matchData.teams.away.name),
  };

  console.log('[matchDataMapper] Lineups mapping complete');
  return lineups;
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
export const mapStandingsToUI = (standingsData: any[]): { leagueName: string; standings: TeamStanding[] } | null => {
  console.log('[matchDataMapper] Mapping standings data:', standingsData);
  
  if (!standingsData || standingsData.length === 0) {
    console.log('[matchDataMapper] No standings data provided');
    return null;
  }

  console.log('[matchDataMapper] Standings data structure:', JSON.stringify(standingsData[0], null, 2).substring(0, 500));

  const leagueData = standingsData[0]?.league;
  const standings = leagueData?.standings?.[0];
  
  if (!standings) {
    console.log('[matchDataMapper] No standings array found in data');
    return null;
  }

  console.log('[matchDataMapper] Found', standings.length, 'teams in standings');

  const mappedStandings = standings.map((team: any) => ({
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

  return {
    leagueName: `${leagueData.name} ${leagueData.season}/${(leagueData.season + 1) % 100}`,
    standings: mappedStandings,
  };
};

/**
 * Extract venue and weather info from predictions and home team data
 * @param predictionsData - Predictions data (may contain weather)
 * @param matchData - Main fixture data
 * @param homeTeamVenue - Home team's venue data (fallback for capacity/surface)
 */
export const extractVenueAndWeather = (predictionsData: any, matchData: FootballApiFixture, homeTeamVenue?: any) => {
  console.log('[matchDataMapper] Extracting venue and weather...');
  console.log('[matchDataMapper] Fixture venue:', JSON.stringify(matchData.fixture.venue, null, 2));
  console.log('[matchDataMapper] Home team venue:', JSON.stringify(homeTeamVenue, null, 2));
  
  // Extract venue info - try fixture.venue first, then fall back to homeTeamVenue
  const venueName = matchData.fixture.venue?.name || homeTeamVenue?.name || 'Unknown Venue';
  const venueCity = matchData.fixture.venue?.city || homeTeamVenue?.city || 'Unknown City';
  
  // Extract capacity - fixture.venue usually doesn't have it, so try homeTeamVenue
  let capacity = 'N/A';
  if (matchData.fixture.venue?.capacity) {
    capacity = `${matchData.fixture.venue.capacity.toLocaleString()} seats`;
  } else if (homeTeamVenue?.capacity) {
    capacity = `${homeTeamVenue.capacity.toLocaleString()} seats`;
  }
  
  // Extract surface - same fallback logic
  let surface = matchData.fixture.venue?.surface || homeTeamVenue?.surface || 'N/A';
  // Capitalize surface if available
  if (surface && surface !== 'N/A') {
    surface = surface.charAt(0).toUpperCase() + surface.slice(1);
  }

  // Try to extract weather from predictions
  let condition = '';
  let temperature = '';

  if (predictionsData) {
    console.log('[matchDataMapper] Checking predictions for weather...');
    
    // Check predictions.weather first (structured data)
    if (predictionsData.weather) {
      console.log('[matchDataMapper] Found weather object:', predictionsData.weather);
      condition = predictionsData.weather.condition || predictionsData.weather.description || '';
      if (predictionsData.weather.temperature !== undefined && predictionsData.weather.temperature !== null) {
        temperature = `${predictionsData.weather.temperature}°C`;
      }
    }
    // Check predictions.forecast as fallback
    else if (predictionsData.forecast) {
      console.log('[matchDataMapper] Found forecast object:', predictionsData.forecast);
      condition = predictionsData.forecast.condition || '';
      if (predictionsData.forecast.temperature !== undefined && predictionsData.forecast.temperature !== null) {
        temperature = `${predictionsData.forecast.temperature}°C`;
      }
    }
    
    // Try to extract weather from advice string using regex
    // Patterns like "Weather: Clear, 22°C" or "Clear 22°C" or just "22°C"
    if (!temperature || !condition) {
      const adviceText = predictionsData.predictions?.advice || predictionsData.advice || '';
      if (adviceText) {
        console.log('[matchDataMapper] Trying to parse advice for weather:', adviceText);
        
        // Try to extract temperature (e.g., "22°C", "22°F", "22 degrees")
        const tempMatch = adviceText.match(/(\d+)\s*°?\s*([CF]|degrees?)/i);
        if (tempMatch && !temperature) {
          const tempValue = tempMatch[1];
          const unit = tempMatch[2]?.toUpperCase().startsWith('F') ? '°F' : '°C';
          temperature = `${tempValue}${unit}`;
          console.log('[matchDataMapper] Extracted temperature from advice:', temperature);
        }
        
        // Try to extract condition (e.g., "Clear", "Cloudy", "Rain")
        const conditionPatterns = ['clear', 'cloudy', 'overcast', 'rain', 'rainy', 'sunny', 'windy', 'snow', 'fog', 'mist'];
        if (!condition) {
          for (const pattern of conditionPatterns) {
            if (adviceText.toLowerCase().includes(pattern)) {
              condition = pattern.charAt(0).toUpperCase() + pattern.slice(1);
              console.log('[matchDataMapper] Extracted condition from advice:', condition);
              break;
            }
          }
        }
      }
    }
  }

  // Set empty strings to null for cleaner UI handling
  // The UI can then decide to hide these fields entirely
  const weatherCondition = condition || null;
  const weatherTemperature = temperature || null;

  const result = {
    venue: {
      name: venueName,
      location: venueCity,
      capacity,
      surface,
    },
    weather: {
      condition: weatherCondition,
      temperature: weatherTemperature,
    },
  };

  console.log('[matchDataMapper] Extracted venue/weather:', result);
  return result;
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

