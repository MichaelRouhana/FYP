/**
 * Utility functions to map Football-API responses to UI formats
 */

import { FootballApiFixture } from '@/types/fixture';
import { MatchLineups, TeamLineup, Player } from '@/mock/matchLineups';
import { MatchStats, StatItem } from '@/mock/matchStats';
import { H2HData, H2HMatch, H2HStats } from '@/mock/matchH2H';
import { MatchSummary, MatchEvent, EventType, TeamSide } from '@/mock/matchSummary';
import { TeamStanding } from '@/mock/matchTable';
import { MatchPowerData } from '@/mock/matchPower/types';
import { mapPredictionsToPower } from '@/utils/powerMapper';

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

  const homeLineup = lineupsData.find(l => l && l.team && l.team.id === matchData.teams.home.id);
  const awayLineup = lineupsData.find(l => l && l.team && l.team.id === matchData.teams.away.id);

  // Allow partial lineups (for fallback scenarios where only one team's lineup is available)
  if (!homeLineup && !awayLineup) {
    console.log('[matchDataMapper] No lineups found for either team');
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
  if (homeLineup && homeLineup.startXI && homeLineup.startXI.length > 0) {
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
        photo: playerStatsInfo.photo || player.photo || (player.id ? `https://media.api-sports.io/football/players/${player.id}.png` : null), // Fallback to API-Sports URL
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
        photo: playerStatsInfo.photo || player.photo || (player.id ? `https://media.api-sports.io/football/players/${player.id}.png` : null), // Fallback to API-Sports URL
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
    homeTeam: homeLineup ? mapTeamLineup(homeLineup, matchData.teams.home.name) : null,
    awayTeam: awayLineup ? mapTeamLineup(awayLineup, matchData.teams.away.name) : null,
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
    const rawDate = match.fixture.date; // ISO date string for sorting
    const historicalHomeTeam = match.teams.home.name;
    const historicalAwayTeam = match.teams.away.name;

    if (isCompleted) {
      if (homeScore > awayScore) {
        // Historical home team won - check if it's the current home or away team
        if (historicalHomeTeam === homeTeamName) {
          homeWins++;
        } else if (historicalHomeTeam === awayTeamName) {
          awayWins++;
        }
      } else if (homeScore < awayScore) {
        // Historical away team won - check if it's the current home or away team
        if (historicalAwayTeam === homeTeamName) {
          homeWins++;
        } else if (historicalAwayTeam === awayTeamName) {
          awayWins++;
        }
      } else {
        // Draw
        draws++;
      }
    }

    return {
      id: `h2h-${index + 1}`,
      date: new Date(match.fixture.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      rawDate, // Store raw date for sorting
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeTeamLogo: match.teams.home.logo || undefined,
      awayTeamLogo: match.teams.away.logo || undefined,
      homeScore: isCompleted ? homeScore : undefined,
      awayScore: isCompleted ? awayScore : undefined,
      time: !isCompleted ? new Date(match.fixture.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) : undefined,
      isCompleted,
    };
  });

  // Sort matches by date (most recent first)
  matches.sort((a, b) => {
    const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
    const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
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

/**
 * Map predictions data to Power tab format with smart fallback using odds
 * @param predictionsData - Predictions data from API
 * @param matchData - Main fixture data
 * @param odds - Optional odds object (if not provided, will try to extract from predictionsData)
 * @returns MatchPowerData with smart fallback if predictions are missing
 */
export const mapPowerData = (
  predictionsData: any,
  matchData: FootballApiFixture,
  odds?: { home: number; draw: number; away: number }
): MatchPowerData => {
  console.log('[mapPowerData] 🔄 Starting power data mapping');
  console.log('[mapPowerData] Match:', matchData?.teams?.home?.name, 'vs', matchData?.teams?.away?.name);
  
  // 1. Try to use predictions data first
  if (predictionsData && matchData) {
    console.log('[mapPowerData] 📥 Attempting to map predictions data...');
    const mapped = mapPredictionsToPower(predictionsData, matchData);
    if (mapped) {
      console.log('[mapPowerData] ✅ Successfully mapped predictions data');
      return mapped;
    } else {
      console.warn('[mapPowerData] ⚠️ Mapping returned null, trying odds fallback');
    }
  } else {
    console.warn('[mapPowerData] ⚠️ Missing predictions or match data, trying odds fallback');
  }

  // 2. Smart Fallback: Try to calculate from Odds
  let calculatedOdds = odds;
  if (!calculatedOdds && predictionsData) {
    // Try to extract odds from predictionsData
    calculatedOdds = extractOdds(predictionsData);
  }

  if (calculatedOdds && calculatedOdds.home && calculatedOdds.away && matchData) {
    console.log('[mapPowerData] 🎲 Calculating fallback from odds:', calculatedOdds);
    
    const homeOdd = parseFloat(String(calculatedOdds.home));
    const awayOdd = parseFloat(String(calculatedOdds.away));
    
    // Calculate implied probabilities
    const homeProb = 1 / homeOdd;
    const awayProb = 1 / awayOdd;
    const totalProb = homeProb + awayProb;

    // Normalize to percentages (0-100)
    const homeStrength = Math.round((homeProb / totalProb) * 100);
    const awayStrength = 100 - homeStrength;

    // Calculate Goal Power based on the Favorite's odds
    // Lower odds = higher expected goals for the favorite
    const lowestOdd = Math.min(homeOdd, awayOdd);
    // Formula: GoalPower = 100 - (lowestOdd * 25)
    // Clamp between 35 and 85 to be safe
    let calculatedGoalPower = Math.round(100 - (lowestOdd * 25));
    calculatedGoalPower = Math.max(35, Math.min(85, calculatedGoalPower));

    console.log(`[mapPowerData] ✅ Generated fallback from odds. Home: ${homeStrength}%, Away: ${awayStrength}%`);
    console.log(`[mapPowerData] 🎯 Goal Power calculated: ${calculatedGoalPower}% (from lowest odd: ${lowestOdd})`);

    // Empty goals by minute structure
    const emptyGoalsByMinute = {
      '0-15': { total: 0, percentage: '0%' },
      '16-30': { total: 0, percentage: '0%' },
      '31-45': { total: 0, percentage: '0%' },
      '46-60': { total: 0, percentage: '0%' },
      '61-75': { total: 0, percentage: '0%' },
      '76-90': { total: 0, percentage: '0%' },
      '91-105': { total: 0, percentage: '0%' },
      '106-120': { total: 0, percentage: '0%' },
    };

    // Generate time series based on strength
    const generateTimeSeries = (baseStrength: number) => [
      { minute: 5, value: Math.max(0, baseStrength - 10) },
      { minute: 10, value: Math.max(0, baseStrength - 5) },
      { minute: 15, value: baseStrength },
      { minute: 20, value: Math.min(100, baseStrength + 5) },
      { minute: 25, value: Math.min(100, baseStrength + 10) },
      { minute: 30, value: baseStrength },
      { minute: 35, value: Math.max(0, baseStrength - 5) },
      { minute: 40, value: baseStrength },
      { minute: 45, value: Math.min(100, baseStrength + 5) },
    ];

    return {
      teamBalance: {
        homeTeam: {
          name: matchData.teams.home.name,
          stats: {
            strength: homeStrength,
            attacking: homeStrength, // Assumption: Stronger team attacks more
            defensive: homeStrength, // Assumption: Stronger team defends better
            goals: calculatedGoalPower, // Calculated from favorite's odds
            draws: 50,
            loss: 100 - homeStrength,
            wins: homeStrength,
          },
        },
        awayTeam: {
          name: matchData.teams.away.name,
          stats: {
            strength: awayStrength,
            attacking: awayStrength,
            defensive: awayStrength,
            goals: calculatedGoalPower, // Calculated from favorite's odds
            draws: 50,
            loss: 100 - awayStrength,
            wins: awayStrength,
          },
        },
      },
      teamPower: {
        homeTeam: {
          name: matchData.teams.home.name,
          timeSeries: generateTimeSeries(homeStrength),
        },
        awayTeam: {
          name: matchData.teams.away.name,
          timeSeries: generateTimeSeries(awayStrength),
        },
      },
      goalPower: {
        homeTeam: {
          name: matchData.teams.home.name,
          goals: {
            for: {
              minute: emptyGoalsByMinute,
            },
          },
        },
        awayTeam: {
          name: matchData.teams.away.name,
          goals: {
            for: {
              minute: emptyGoalsByMinute,
            },
          },
        },
      },
    };
  }

  // 3. Final Fallback: 50/50 (existing behavior)
  console.warn('[mapPowerData] ⚠️ Missing predictions AND odds, using 50/50 fallback');
  
  const emptyGoalsByMinute = {
    '0-15': { total: 0, percentage: '0%' },
    '16-30': { total: 0, percentage: '0%' },
    '31-45': { total: 0, percentage: '0%' },
    '46-60': { total: 0, percentage: '0%' },
    '61-75': { total: 0, percentage: '0%' },
    '76-90': { total: 0, percentage: '0%' },
    '91-105': { total: 0, percentage: '0%' },
    '106-120': { total: 0, percentage: '0%' },
  };

  const defaultStats = {
    strength: 50,
    attacking: 50,
    defensive: 50,
    wins: 50,
    draws: 50,
    loss: 50,
    goals: 50,
  };

  return {
    teamBalance: {
      homeTeam: {
        name: matchData?.teams?.home?.name || 'Home',
        stats: defaultStats,
      },
      awayTeam: {
        name: matchData?.teams?.away?.name || 'Away',
        stats: defaultStats,
      },
    },
    teamPower: {
      homeTeam: {
        name: matchData?.teams?.home?.name || 'Home',
        timeSeries: [],
      },
      awayTeam: {
        name: matchData?.teams?.away?.name || 'Away',
        timeSeries: [],
      },
    },
    goalPower: {
      homeTeam: {
        name: matchData?.teams?.home?.name || 'Home',
        goals: {
          for: {
            minute: emptyGoalsByMinute,
          },
        },
      },
      awayTeam: {
        name: matchData?.teams?.away?.name || 'Away',
        goals: {
          for: {
            minute: emptyGoalsByMinute,
          },
        },
      },
    },
  };
};

/**
 * Extract predictions from predictions data
 * @param predictionsData - Predictions data from API
 * @returns Object with match winner, double chance, goals over/under, both teams to score, and first team to score
 */
export interface ExtractedPredictions {
  matchWinner: 'Home' | 'Draw' | 'Away' | null;
  doubleChance: 'x1' | '12' | 'x2' | null;
  goalsOverUnder: 'Over 2.5' | 'Under 2.5' | null;
  bothTeamsScore: 'Yes' | 'No' | null;
  firstTeamScore: 'Home' | 'Away' | null;
}

/**
 * Helper function to parse percentage string to number
 * @param value - String like "45%" or number
 * @returns Parsed number or 0 if invalid
 */
const parsePercentage = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const extractPredictions = (predictionsData: any): ExtractedPredictions => {
  console.log('[extractPredictions] 🔍 Extracting predictions from data');
  
  // Handle array response
  let actualPredictionsData = predictionsData;
  if (Array.isArray(predictionsData) && predictionsData.length > 0) {
    actualPredictionsData = predictionsData[0];
    console.log('[extractPredictions] 📦 Predictions is array, using first item');
  }

  if (!actualPredictionsData) {
    console.warn('[extractPredictions] ⚠️ No predictions data available');
    return {
      matchWinner: null,
      doubleChance: null,
      goalsOverUnder: null,
      bothTeamsScore: null,
      firstTeamScore: null,
    };
  }

  // Extract predictions object (may be nested)
  const predictions = actualPredictionsData.predictions || actualPredictionsData;
  
  // 1. Match Winner: Compare Home, Draw, Away percentages
  let matchWinner: 'Home' | 'Draw' | 'Away' | null = null;
  
  // Try different possible structures for match winner percentages
  // Structure 1: predictions.winner.home, predictions.winner.draw, predictions.winner.away
  // Structure 2: predictions.match_winner.home, etc.
  // Structure 3: comparison.wins.home, comparison.wins.draw, comparison.wins.away
  const comparison = actualPredictionsData.comparison || predictions.comparison || {};
  const wins = comparison.wins || {};
  
  let homePercent = parsePercentage(predictions.winner?.home || predictions.match_winner?.home || wins.home || '0%');
  let drawPercent = parsePercentage(predictions.winner?.draw || predictions.match_winner?.draw || wins.draw || '0%');
  let awayPercent = parsePercentage(predictions.winner?.away || predictions.match_winner?.away || wins.away || '0%');
  
  // If all are 0, try to extract from form percentages as fallback
  if (homePercent === 0 && drawPercent === 0 && awayPercent === 0) {
    const form = comparison.form || {};
    homePercent = parsePercentage(form.home || '0%');
    awayPercent = parsePercentage(form.away || '0%');
    // Estimate draw as remainder
    if (homePercent > 0 || awayPercent > 0) {
      drawPercent = Math.max(0, 100 - homePercent - awayPercent);
    }
  }

  console.log('[extractPredictions] 📊 Match Winner percentages:', { homePercent, drawPercent, awayPercent });

  if (homePercent > 0 || drawPercent > 0 || awayPercent > 0) {
    if (homePercent >= drawPercent && homePercent >= awayPercent) {
      matchWinner = 'Home';
    } else if (drawPercent >= homePercent && drawPercent >= awayPercent) {
      matchWinner = 'Draw';
    } else {
      matchWinner = 'Away';
    }
  }

  console.log('[extractPredictions] 🏆 Match Winner:', matchWinner);

  // 2. Double Chance: Calculate x1, 12, x2
  let doubleChance: 'x1' | '12' | 'x2' | null = null;
  
  if (homePercent > 0 || drawPercent > 0 || awayPercent > 0) {
    const x1 = homePercent + drawPercent; // Home or Draw
    const x12 = homePercent + awayPercent; // Home or Away (no draw)
    const x2 = awayPercent + drawPercent; // Away or Draw

    console.log('[extractPredictions] 🎲 Double Chance calculations:', { x1, x12, x2 });

    if (x1 >= x12 && x1 >= x2) {
      doubleChance = 'x1';
    } else if (x12 >= x1 && x12 >= x2) {
      doubleChance = '12'; // Use '12' not 'x12' to match type definition
    } else {
      doubleChance = 'x2';
    }
  }

  console.log('[extractPredictions] 🎯 Double Chance:', doubleChance);

  // 3. Goals Over/Under: Parse prediction.goals.home and prediction.goals.away
  let goalsOverUnder: 'Over 2.5' | 'Under 2.5' | null = null;
  
  const goals = predictions.goals || actualPredictionsData.goals || {};
  const homeGoals = typeof goals.home === 'number' ? goals.home : parseFloat(String(goals.home || 0));
  const awayGoals = typeof goals.away === 'number' ? goals.away : parseFloat(String(goals.away || 0));
  const totalGoals = Math.abs(homeGoals) + Math.abs(awayGoals);

  console.log('[extractPredictions] ⚽ Goals data:', { homeGoals, awayGoals, totalGoals });

  if (totalGoals > 2.5) {
    goalsOverUnder = 'Over 2.5';
  } else if (totalGoals > 0) {
    goalsOverUnder = 'Under 2.5';
  } else {
    // Fallback: Check if prediction.advice contains the word "Over"
    const advice = predictions.advice || actualPredictionsData.advice || '';
    if (advice.toLowerCase().includes('over')) {
      goalsOverUnder = 'Over 2.5';
    } else if (advice.toLowerCase().includes('under')) {
      goalsOverUnder = 'Under 2.5';
    }
  }

  console.log('[extractPredictions] 📈 Goals Over/Under:', goalsOverUnder);

  // 4. Both Teams To Score: If match winner % < 50% AND Over 2.5, return "Yes"
  let bothTeamsScore: 'Yes' | 'No' | null = null;
  
  if (matchWinner) {
    const matchWinnerPercent = matchWinner === 'Home' ? homePercent : matchWinner === 'Draw' ? drawPercent : awayPercent;
    
    if (matchWinnerPercent < 50 && goalsOverUnder === 'Over 2.5') {
      bothTeamsScore = 'Yes';
    } else {
      bothTeamsScore = 'No';
    }
  }

  console.log('[extractPredictions] 🎪 Both Teams To Score:', bothTeamsScore);

  // 5. First Team To Score: Return the matchWinner
  const firstTeamScore: 'Home' | 'Away' | null = matchWinner === 'Home' ? 'Home' : matchWinner === 'Away' ? 'Away' : null;

  console.log('[extractPredictions] 🥅 First Team To Score:', firstTeamScore);

  return {
    matchWinner,
    doubleChance,
    goalsOverUnder,
    bothTeamsScore,
    firstTeamScore,
  };
};

