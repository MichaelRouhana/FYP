import { GoalPowerChart, TeamBalanceChart, TeamPowerChart } from '@/components/charts';
import { useTheme } from '@/context/ThemeContext';
import { CommentaryItem } from '@/mock/matchCommentary';
import { mapEventsToCommentary } from '@/utils/commentaryMapper';
import { H2HMatch } from '@/mock/matchH2H';
import { getRatingColor, Player } from '@/mock/matchLineups';
import { CHART_COLORS } from '@/mock/matchPower/constants';
import { eventLegend, EventType, MatchEvent } from '@/mock/matchSummary';
import { TeamStanding } from '@/mock/matchTable';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchData } from '@/hooks/useMatchData';
import { useUserBalance } from '@/hooks/useUserBalance';
import { useProfile } from '@/hooks/useProfile';
import { placeBet, createMatchWinnerBet, getOddsForSelection, getOdds } from '@/services/betApi';
import { MarketType, BetRequestDTO } from '@/types/bet';
import { getFixtureInjuries, getBetTypes, getOddsForFixture, getPredictionSettings } from '@/services/matchApi';
import { FootballApiInjury } from '@/types/fixture';
import AdminMatchSettings from '@/components/match/AdminMatchSettings';
import {
  mapLineupsToUI,
  mapStatsToUI,
  mapEventsToUI,
  mapH2HToUI,
  mapStandingsToUI,
  extractVenueAndWeather,
  extractOdds,
  mapPowerData,
} from '@/utils/matchDataMapper';
import {
  resolveBetTypeId,
  extractMarket,
  extractOverUnderMarket,
  extractHandicapMarket,
  extractTeamTotalMarket,
  deriveGoalsInBothHalves,
  Market,
  BetType,
} from '@/utils/oddsMapper';

type TabType = 'details' | 'predictions' | 'summary' | 'lineups' | 'stats' | 'h2h' | 'table' | 'power' | 'commentary' | 'settings';
type MatchStatus = 'upcoming' | 'live' | 'finished';
type BetSelection = 'home' | 'draw' | 'away' | null;
type GoalsOverUnder = 'x1' | '12' | 'x2' | null;
type BothTeamsScore = 'yes' | 'no' | null;
type FirstTeamScore = 'home' | 'away' | null;
type DoubleChance = 'x1' | '12' | 'x2' | null;

// All available tabs with their labels
// Settings tab is first for admins
const ALL_TABS: { id: TabType; label: string }[] = [
  { id: 'settings', label: 'SETTINGS' },
  { id: 'details', label: 'DETAILS' },
  { id: 'predictions', label: 'PREDICTIONS' },
  { id: 'summary', label: 'SUMMARY' },
  { id: 'lineups', label: 'LINEUP' },
  { id: 'table', label: 'STANDINGS' },
  { id: 'commentary', label: 'COMMENTARY' },
  { id: 'stats', label: 'STATS' },
  { id: 'h2h', label: 'H2H' },
  { id: 'power', label: 'POWER' },
];

// Tab configuration per match status (based on user requirements)
const TABS_BY_STATUS: Record<MatchStatus, TabType[]> = {
  // Upcoming Match (NS - Not Started)
  // ✅ Show: PREDICTIONS, LINEUP, H2H, STANDINGS, POWER, DETAILS
  // ❌ Hide: Summary, Stats, Commentary
  upcoming: ['predictions', 'lineups', 'h2h', 'table', 'power', 'details'],
  
  // Live Match (1H, 2H, HT, ET, etc.)
  // ✅ Show: SUMMARY (labeled as COMMENTARY), STATS, LINEUP, H2H, STANDINGS, POWER, DETAILS
  // ❌ Hide: Predictions, Commentary tab
  live: ['summary', 'stats', 'lineups', 'h2h', 'table', 'power', 'details'],
  
  // Completed Match (FT, AET, PEN)
  // ✅ Show: COMMENTARY (labeled as SUMMARY), STATS, LINEUP, H2H, STANDINGS, DETAILS
  // ❌ Hide: Predictions, Power, Summary tab
  finished: ['commentary', 'stats', 'lineups', 'h2h', 'table', 'details'],
};

// Default tabs for each status - always start with details
const DEFAULT_TAB_BY_STATUS: Record<MatchStatus, TabType> = {
  upcoming: 'details',
  live: 'details',
  finished: 'details',
};

/**
 * Determine match status from API status code
 */
const getMatchStatus = (statusShort: string | undefined): MatchStatus => {
  if (!statusShort) return 'upcoming';
  
  const status = statusShort.toUpperCase();
  
  // Live statuses
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(status)) {
    return 'live';
  }
  
  // Finished statuses
  if (['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status)) {
    return 'finished';
  }
  
  // Default to upcoming (NS, TBD, etc.)
  return 'upcoming';
};

/**
 * Get filtered tabs based on match status with dynamic labels
 */
const getTabsForStatus = (status: MatchStatus, isAdmin: boolean = false): { id: TabType; label: string }[] => {
  const allowedTabs = TABS_BY_STATUS[status];
  const filteredTabs = ALL_TABS.filter(tab => {
    // Always include settings tab for admins
    if (tab.id === 'settings') {
      return isAdmin;
    }
    return allowedTabs.includes(tab.id);
  });
  
  // Map tabs and apply label transformations
  const mappedTabs = filteredTabs.map(tab => {
    // For live games: "summary" tab shows as "COMMENTARY"
    if (status === 'live' && tab.id === 'summary') {
      return { ...tab, label: 'COMMENTARY' };
    }
    // For finished games: "commentary" tab shows as "SUMMARY"
    if (status === 'finished' && tab.id === 'commentary') {
      return { ...tab, label: 'SUMMARY' };
    }
    return tab;
  });
  
  // For admins: ensure settings tab is first in the list
  if (isAdmin) {
    const settingsTab = mappedTabs.find(tab => tab.id === 'settings');
    const otherTabs = mappedTabs.filter(tab => tab.id !== 'settings');
    if (settingsTab) {
      return [settingsTab, ...otherTabs];
    }
  }
  
  return mappedTabs;
};

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  // Fetch real data from API
  const { 
    loading, 
    error, 
    matchData,
    lineups: lineupsData,
    isProjectedLineup,
    playerStats: playerStatsData,
    homeTeamVenue,
    stats: statsData,
    events: eventsData,
    h2h: h2hData,
    standings: standingsData,
    predictions: predictionsData,
  } = useMatchData(id || '');
  const { balance, refetch: refetchBalance } = useUserBalance();
  const { user } = useProfile();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') || false;
  const [submitting, setSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<FootballApiInjury[]>([]);
  const [injuryFilter, setInjuryFilter] = useState<'home' | 'away'>('home');
  const [apiOdds, setApiOdds] = useState<{ home: number; draw: number; away: number } | null>(null);
  
  // Odds data state
  const [oddsData, setOddsData] = useState<any[]>([]);
  const [betTypes, setBetTypes] = useState<BetType[]>([]);
  const [oddsMarkets, setOddsMarkets] = useState<Record<string, Market | null>>({});
  const [oddsLoading, setOddsLoading] = useState(false);
  const [predictionSettings, setPredictionSettings] = useState<{ 
    whoWillWin?: boolean; 
    bothTeamsScore?: boolean; 
    goalsOverUnder?: boolean; 
    doubleChance?: boolean;
    firstTeamToScore?: boolean;
    scorePrediction?: boolean;
    halfTimeFullTime?: boolean;
  } | null>(null);
  
  // Structured picks state
  interface Pick {
    marketKey: string;
    selection: string;
    line?: number | string;
    odds?: number;
    meta?: any;
  }
  const [selectedPicks, setSelectedPicks] = useState<Pick[]>([]);
  
  // All state hooks MUST be called unconditionally
  // Default to 'settings' tab for admins, otherwise use 'details'
  const [selectedTab, setSelectedTab] = useState<TabType>(isAdmin ? 'settings' : 'details');
  const [h2hFilter, setH2hFilter] = useState<'meetings' | 'home' | 'away'>('meetings');
  const [h2hShowAll, setH2hShowAll] = useState(false);
  const [tableFilter, setTableFilter] = useState<'all' | 'home' | 'away'>('all');
  const [betSelection, setBetSelection] = useState<BetSelection>(null);
  const [stake, setStake] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Predictions state
  const [goalsOverUnder, setGoalsOverUnder] = useState<GoalsOverUnder>(null);
  const [bothTeamsScore, setBothTeamsScore] = useState<BothTeamsScore>(null);
  const [firstTeamScore, setFirstTeamScore] = useState<FirstTeamScore>(null);
  const [doubleChance, setDoubleChance] = useState<DoubleChance>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  // Determine match status and available tabs
  const matchStatus = useMemo(() => {
    const status = getMatchStatus(matchData?.fixture?.status?.short);
    console.log('[MatchDetails] Status detection:', {
      statusShort: matchData?.fixture?.status?.short,
      statusLong: matchData?.fixture?.status?.long,
      elapsed: matchData?.fixture?.status?.elapsed,
      detectedStatus: status,
    });
    return status;
  }, [matchData?.fixture?.status?.short]);

  const availableTabs = useMemo(() => {
    return getTabsForStatus(matchStatus, isAdmin);
  }, [matchStatus, isAdmin]);

  // Auto-select appropriate default tab when match status changes
  // Only set default ONCE on initial load, then allow free tab switching
  const [hasAutoSelectedTab, setHasAutoSelectedTab] = useState(false);
  
  React.useEffect(() => {
    // Only set default tab once - don't interfere with user's tab selection after that
    if (hasAutoSelectedTab) {
      return; // User has already selected a tab, don't override
    }
    
    // For admins: set default to 'settings' tab if available (only once)
    if (isAdmin && availableTabs.some(t => t.id === 'settings')) {
      setSelectedTab('settings');
      setHasAutoSelectedTab(true);
      return;
    }
    
    // For non-admins: auto-select appropriate default tab when match status changes
    if (matchData) {
      const defaultTab = DEFAULT_TAB_BY_STATUS[matchStatus];
      if (defaultTab && availableTabs.some(t => t.id === defaultTab)) {
        setSelectedTab(defaultTab);
        setHasAutoSelectedTab(true);
      }
    }
  }, [matchData, matchStatus, availableTabs, hasAutoSelectedTab, isAdmin]);

  // Fetch injuries data
  useEffect(() => {
    const fetchInjuries = async () => {
      if (!id) return;
      try {
        const injuriesData = await getFixtureInjuries(id);
        setInjuries(injuriesData || []);
      } catch (error) {
        console.error('[MatchDetails] Error fetching injuries:', error);
        setInjuries([]);
      }
    };
    fetchInjuries();
  }, [id]);

  // Fetch prediction settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!id) return;
      try {
        const settings = await getPredictionSettings(Number(id));
        setPredictionSettings(settings);
      } catch (error) {
        console.error('[MatchDetails] Error fetching prediction settings:', error);
        // Default to showing all if settings can't be fetched
        setPredictionSettings(null);
      }
    };
    fetchSettings();
  }, [id]);

  // Fetch odds data and resolve bet types
  useEffect(() => {
    const fetchOddsData = async () => {
      if (!matchData?.fixture?.id) return;

      setOddsLoading(true);
      try {
        // Fetch odds for fixture first (this is the critical data)
        const odds = await getOddsForFixture(matchData.fixture.id);
        setOddsData(odds);

        // Try to fetch bet types (optional - if it fails, we'll parse from odds directly)
        let allBetTypes: BetType[] = [];
        try {
          allBetTypes = await getBetTypes();
          setBetTypes(allBetTypes);
          console.log('[MatchDetails] ✅ Fetched bet types:', allBetTypes.length);
        } catch (betTypesError: any) {
          console.warn('[MatchDetails] ⚠️ Could not fetch bet types, will parse from odds directly:', betTypesError.message);
          // Continue without bet types - we'll extract from odds response
        }

        // Resolve bet type IDs for each market (if bet types available)
        const searchQueries = [
          { key: 'match_winner', query: 'Match Winner', fallbackId: 1 }, // Common bet ID for Match Winner
          { key: 'double_chance', query: 'Double Chance', fallbackId: 2 },
          { key: 'goals_ou', query: 'Goals Over/Under', fallbackId: 5 },
          { key: 'btts', query: 'Both Teams Score', fallbackId: 8 },
          { key: 'handicap_result', query: 'Handicap Result', fallbackId: 12 },
          { key: 'team_score_first', query: 'Team To Score First', fallbackId: 16 },
          { key: 'team_score_last', query: 'Team To Score Last', fallbackId: null },
          { key: 'first_half_ou', query: 'Goals Over/Under - First Half', fallbackId: 6 },
          { key: 'second_half_ou', query: 'Goals Over/Under - Second Half', fallbackId: 7 },
          { key: 'team_total_home', query: 'Total - Home', fallbackId: null },
          { key: 'team_total_away', query: 'Total - Away', fallbackId: null },
        ];

        const resolvedBetIds: Record<string, number | null> = {};
        
        // If we have bet types, try to resolve by name
        if (allBetTypes.length > 0) {
          for (const { key, query, fallbackId } of searchQueries) {
            const betId = resolveBetTypeId(query, allBetTypes);
            resolvedBetIds[key] = betId || fallbackId;
            console.log(`[MatchDetails] Resolved ${key}: ${betId || fallbackId} (${query})`);
          }
        } else {
          // Use fallback IDs or extract from odds response directly
          console.log('[MatchDetails] Using fallback bet IDs or parsing from odds response');
          for (const { key, fallbackId } of searchQueries) {
            resolvedBetIds[key] = fallbackId;
          }
          
          // Try to extract bet IDs from odds response by name matching
          if (odds && odds.length > 0) {
            for (const oddsItem of odds) {
              if (!oddsItem || !oddsItem.bookmakers) continue;
              for (const bookmaker of oddsItem.bookmakers) {
                if (!bookmaker || !bookmaker.bets) continue;
                for (const bet of bookmaker.bets) {
                  if (!bet || !bet.name || !bet.id) continue;
                  const betNameLower = bet.name.toLowerCase();
                  // Match by bet name
                  if (betNameLower.includes('match winner') || betNameLower.includes('1x2')) {
                    if (!resolvedBetIds.match_winner) resolvedBetIds.match_winner = bet.id;
                  } else if (betNameLower.includes('double chance')) {
                    if (!resolvedBetIds.double_chance) resolvedBetIds.double_chance = bet.id;
                  } else if (betNameLower.includes('goals over/under') || betNameLower.includes('total goals')) {
                    if (betNameLower.includes('first half')) {
                      if (!resolvedBetIds.first_half_ou) resolvedBetIds.first_half_ou = bet.id;
                    } else if (betNameLower.includes('second half')) {
                      if (!resolvedBetIds.second_half_ou) resolvedBetIds.second_half_ou = bet.id;
                    } else {
                      if (!resolvedBetIds.goals_ou) resolvedBetIds.goals_ou = bet.id;
                    }
                  } else if (betNameLower.includes('both teams') || betNameLower.includes('btts')) {
                    if (!resolvedBetIds.btts) resolvedBetIds.btts = bet.id;
                  } else if (betNameLower.includes('handicap')) {
                    if (!resolvedBetIds.handicap_result) resolvedBetIds.handicap_result = bet.id;
                  } else if (betNameLower.includes('team to score first')) {
                    if (!resolvedBetIds.team_score_first) resolvedBetIds.team_score_first = bet.id;
                  } else if (betNameLower.includes('team to score last')) {
                    if (!resolvedBetIds.team_score_last) resolvedBetIds.team_score_last = bet.id;
                  }
                }
              }
            }
            console.log('[MatchDetails] Extracted bet IDs from odds response:', resolvedBetIds);
          }
        }

        // Extract markets
        const markets: Record<string, Market | null> = {};

        // Match Winner
        if (resolvedBetIds.match_winner) {
          markets.match_winner = extractMarket(
            odds,
            resolvedBetIds.match_winner,
            'match_winner',
            'Match Result (1X2)'
          );
        }

        // Double Chance
        if (resolvedBetIds.double_chance) {
          markets.double_chance = extractMarket(
            odds,
            resolvedBetIds.double_chance,
            'double_chance',
            'Double Chance'
          );
        }

        // Total Goals O/U
        if (resolvedBetIds.goals_ou) {
          markets.goals_ou = extractOverUnderMarket(
            odds,
            resolvedBetIds.goals_ou,
            'goals_ou',
            'Total Goals (O/U)'
          );
        }

        // BTTS
        if (resolvedBetIds.btts) {
          markets.btts = extractMarket(
            odds,
            resolvedBetIds.btts,
            'btts',
            'Both Teams To Score'
          );
        }

        // Handicap Result
        if (resolvedBetIds.handicap_result) {
          markets.handicap_result = extractHandicapMarket(
            odds,
            resolvedBetIds.handicap_result,
            'handicap_result',
            'Goals Handicap'
          );
        }

        // First Team To Score
        if (resolvedBetIds.team_score_first) {
          markets.team_score_first = extractMarket(
            odds,
            resolvedBetIds.team_score_first,
            'team_score_first',
            'First Team To Score'
          );
        }

        // Last Team To Score
        if (resolvedBetIds.team_score_last) {
          markets.team_score_last = extractMarket(
            odds,
            resolvedBetIds.team_score_last,
            'team_score_last',
            'Last Team To Score'
          );
        }

        // First Half O/U (for deriving Goals in Both Halves)
        if (resolvedBetIds.first_half_ou) {
          markets.first_half_ou = extractOverUnderMarket(
            odds,
            resolvedBetIds.first_half_ou,
            'first_half_ou',
            'First Half Goals O/U'
          );
        }

        // Second Half O/U (for deriving Goals in Both Halves)
        if (resolvedBetIds.second_half_ou) {
          markets.second_half_ou = extractOverUnderMarket(
            odds,
            resolvedBetIds.second_half_ou,
            'second_half_ou',
            'Second Half Goals O/U'
          );
        }

        // Derive Goals in Both Halves
        markets.goals_both_halves = deriveGoalsInBothHalves(
          markets.first_half_ou,
          markets.second_half_ou
        );

        // Team Totals
        if (resolvedBetIds.team_total_home) {
          markets.team_total_home = extractTeamTotalMarket(
            odds,
            resolvedBetIds.team_total_home,
            'team_total_home',
            'Home Team Total Goals (O/U)',
            'home'
          );
        }

        if (resolvedBetIds.team_total_away) {
          markets.team_total_away = extractTeamTotalMarket(
            odds,
            resolvedBetIds.team_total_away,
            'team_total_away',
            'Away Team Total Goals (O/U)',
            'away'
          );
        }

        setOddsMarkets(markets);
        console.log('[MatchDetails] ✅ Odds markets extracted:', Object.keys(markets));
      } catch (error) {
        console.error('[MatchDetails] Error fetching odds data:', error);
      } finally {
        setOddsLoading(false);
      }
    };

    fetchOddsData();
  }, [matchData?.fixture?.id]);

  // Transform events into commentary
  const commentary = useMemo(() => {
    if (eventsData && matchData) {
      const items = mapEventsToCommentary(eventsData, matchData);
      return { items };
    }
    // Fallback to empty commentary if no events
    return { items: [] };
  }, [eventsData, matchData]);

  // Transform predictions data to Power tab format with smart fallback using odds
  const powerData = useMemo(() => {
    if (!matchData) {
      console.warn('[PowerTab] ⚠️ No match data available');
      return null;
    }

    // Extract odds if available (for fallback)
    const odds = extractOdds(predictionsData);
    
    // Use the new mapPowerData function with smart fallback
    const result = mapPowerData(predictionsData, matchData, odds);
    
    // Log the result for debugging
    console.log('[PowerTab] 📊 Final powerData:', {
      homeTeam: result.teamBalance.homeTeam.name,
      awayTeam: result.teamBalance.awayTeam.name,
      homeStats: result.teamBalance.homeTeam.stats,
      awayStats: result.teamBalance.awayTeam.stats,
      isUsingFallback: result.teamBalance.homeTeam.stats.strength === 50 && result.teamBalance.awayTeam.stats.strength === 50,
      isUsingOddsFallback: result.teamBalance.homeTeam.stats.strength !== 50 && result.teamBalance.awayTeam.stats.strength !== 50 && !predictionsData,
    });
    
    return result;
  }, [predictionsData, matchData]);


  // Transform API data to UI format using memoization
  // Note: If isProjectedLineup is true, lineupsData is already in array format [home, away]
  // and will be handled in renderLineupsTab
  const lineups = useMemo(() => {
    // Only map if lineupsData is not an array (official lineups format)
    if (Array.isArray(lineupsData) && lineupsData.length > 0 && lineupsData[0] && typeof lineupsData[0] === 'object' && 'team' in lineupsData[0]) {
      // This is the fallback array format, don't map here
      return null;
    }
    const result = matchData && lineupsData && !Array.isArray(lineupsData) ? mapLineupsToUI(lineupsData, matchData, playerStatsData) : null;
    console.log('[MatchDetails] Lineups transformed:', result ? 'Success' : 'Null');
    return result;
  }, [matchData, lineupsData, playerStatsData]);

  const stats = useMemo(() => {
    const result = statsData ? mapStatsToUI(statsData) : null;
    console.log('[MatchDetails] Stats transformed:', result ? 'Success' : 'Null');
    return result;
  }, [statsData]);

  const summary = useMemo(() => {
    const result = matchData && eventsData ? mapEventsToUI(eventsData, matchData) : null;
    console.log('[MatchDetails] Summary transformed:', result ? `${result?.events?.length} events` : 'Null');
    return result;
  }, [matchData, eventsData]);

  const h2h = useMemo(() => {
    const result = matchData && h2hData ? mapH2HToUI(
      h2hData, 
      matchData.teams.home.name, 
      matchData.teams.away.name
    ) : null;
    console.log('[MatchDetails] H2H transformed:', result ? `${result.matches?.length} matches` : 'Null');
    return result;
  }, [matchData, h2hData]);

  // Filter H2H matches based on selected filter (must be at top level, not in render function)
  const filteredH2HMatches = useMemo(() => {
    if (!h2h || !h2h.matches) return [];
    
    let filtered = h2h.matches;
    
    if (h2hFilter === 'home') {
      // Show only matches where the home team WON
      const homeTeamName = h2h.homeTeam.toLowerCase();
      filtered = h2h.matches.filter(match => {
        if (!match.isCompleted) return false; // Only show completed matches for wins
        const isHomeTeam = match.homeTeam.toLowerCase() === homeTeamName;
        const isAwayTeam = match.awayTeam.toLowerCase() === homeTeamName;
        
        if (isHomeTeam) {
          // Home team won if homeScore > awayScore
          return match.homeScore !== undefined && match.awayScore !== undefined && 
                 match.homeScore > match.awayScore;
        } else if (isAwayTeam) {
          // Away team won if awayScore > homeScore
          return match.homeScore !== undefined && match.awayScore !== undefined && 
                 match.awayScore > match.homeScore;
        }
        return false;
      });
    } else if (h2hFilter === 'away') {
      // Show only matches where the away team WON
      const awayTeamName = h2h.awayTeam.toLowerCase();
      filtered = h2h.matches.filter(match => {
        if (!match.isCompleted) return false; // Only show completed matches for wins
        const isHomeTeam = match.homeTeam.toLowerCase() === awayTeamName;
        const isAwayTeam = match.awayTeam.toLowerCase() === awayTeamName;
        
        if (isHomeTeam) {
          // Home team won if homeScore > awayScore
          return match.homeScore !== undefined && match.awayScore !== undefined && 
                 match.homeScore > match.awayScore;
        } else if (isAwayTeam) {
          // Away team won if awayScore > homeScore
          return match.homeScore !== undefined && match.awayScore !== undefined && 
                 match.awayScore > match.homeScore;
        }
        return false;
      });
    }
    // 'meetings' shows all matches (no filtering)
    
    // Ensure matches are sorted by date (most recent first)
    return filtered.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }, [h2h, h2hFilter]);

  const table = useMemo(() => {
    if (!standingsData) return null;
    
    const baseResult = mapStandingsToUI(standingsData);
    if (!baseResult || !baseResult.standings) return null;

    // If filter is 'all', return base result
    if (tableFilter === 'all') {
      return baseResult;
    }

    // For 'home' or 'away' filters, we need to re-map using filtered stats
    const leagueData = standingsData[0]?.league;
    const standings = leagueData?.standings?.[0];
    
    if (!standings) return baseResult;

    // Map standings with filtered stats
    const filteredStandings = standings.map((team: any) => {
      // Select stats based on filter
      const stats = tableFilter === 'home' ? team.home : team.away;
      
      if (!stats) {
        // Fallback to 'all' stats if home/away stats not available
        const allStats = team.all;
        const points = (allStats.win * 3) + (allStats.draw * 1);
        
        return {
          position: team.rank,
          teamName: team.team.name,
          played: allStats.played,
          won: allStats.win,
          drawn: allStats.draw,
          lost: allStats.lose,
          goalsFor: allStats.goals.for,
          goalsAgainst: allStats.goals.against,
          points: points,
        };
      }

      // Calculate points: 3 for win, 1 for draw, 0 for loss
      const points = (stats.win * 3) + (stats.draw * 1);

      return {
        position: 0, // Will be recalculated after sorting
        teamName: team.team.name,
        played: stats.played,
        won: stats.win,
        drawn: stats.draw,
        lost: stats.lose,
        goalsFor: stats.goals.for,
        goalsAgainst: stats.goals.against,
        points: points,
      };
    });

    // Sort by points (descending), then goal difference (descending), then goals for (descending)
    filteredStandings.sort((a: any, b: any) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Calculate goal difference for sorting
      const aGoalDiff = a.goalsFor - a.goalsAgainst;
      const bGoalDiff = b.goalsFor - b.goalsAgainst;
      if (bGoalDiff !== aGoalDiff) {
        return bGoalDiff - aGoalDiff;
      }
      return b.goalsFor - a.goalsFor;
    });

    // Reassign positions after sorting
    filteredStandings.forEach((team: any, index: number) => {
      team.position = index + 1;
    });

    return {
      leagueName: baseResult.leagueName,
      standings: filteredStandings,
    };
  }, [standingsData, tableFilter]);

  // Transform API data to match UI expectations (with null checks)
  const match = useMemo(() => {
    if (!matchData) return null;

    console.log('[MatchDetails] Transforming match data...');
    console.log('[MatchDetails] Match data venue:', matchData.fixture.venue);
    console.log('[MatchDetails] Home team venue:', homeTeamVenue);
    console.log('[MatchDetails] Predictions data available:', !!predictionsData);
    
    const venueWeather = extractVenueAndWeather(predictionsData, matchData, homeTeamVenue);
    // Use API odds if available, otherwise fall back to extracted odds
    const odds = apiOdds || extractOdds(predictionsData);

    console.log('[MatchDetails] Venue:', venueWeather.venue);
    console.log('[MatchDetails] Weather:', venueWeather.weather);
    console.log('[MatchDetails] Odds:', odds);

    return {
      id: matchData.fixture.id,
      homeTeam: {
        name: matchData.teams.home.name,
        logo: matchData.teams.home.logo,
      },
      awayTeam: {
        name: matchData.teams.away.name,
        logo: matchData.teams.away.logo,
      },
      homeScore: matchData.goals.home ?? 0,
      awayScore: matchData.goals.away ?? 0,
      league: matchData.league.name,
      date: new Date(matchData.fixture.date).toLocaleDateString(),
      statusShort: matchData.fixture.status.short,
      statusLong: matchData.fixture.status.long,
      elapsed: matchData.fixture.status.elapsed,
      kickoffTime: new Date(matchData.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      venue: venueWeather.venue,
      weather: venueWeather.weather,
      odds,
      isFavorite: isFavorite,
    };
  }, [matchData, predictionsData, homeTeamVenue, isFavorite, apiOdds]);

  const potentialWinnings = useMemo(() => {
    if (!stake || !betSelection || !match) return 0;
    const stakeNum = parseFloat(stake) || 0;
    const odds =
      betSelection === 'home'
        ? match.odds.home
        : betSelection === 'draw'
        ? match.odds.draw
        : match.odds.away;
    return Math.round(stakeNum * odds);
  }, [stake, betSelection, match]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: isDark ? '#ffffff' : '#18223A', marginTop: 16, fontSize: 14 }}>Loading match data...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !matchData || !match) {
    // Check if it's a rate limit error
    const isRateLimitError = error?.toLowerCase().includes('limit') || error?.toLowerCase().includes('request');
    
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <MaterialCommunityIcons 
          name={isRateLimitError ? "clock-alert-outline" : "alert-circle-outline"} 
          size={64} 
          color={isDark ? '#9ca3af' : '#6B7280'} 
        />
        <Text style={{ color: isDark ? '#ffffff' : '#18223A', marginTop: 16, fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>
          {isRateLimitError ? 'API Limit Reached' : 'Failed to load match data'}
        </Text>
        <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
          {error || 'Please try again later'}
        </Text>
        {isRateLimitError && (
          <Text style={{ color: isDark ? '#6b7280' : '#9ca3af', marginTop: 8, fontSize: 12, textAlign: 'center' }}>
            The API has a daily request limit. Try again tomorrow or upgrade your plan.
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity 
            style={{ backgroundColor: isDark ? '#1f2937' : '#e5e7eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: isDark ? '#ffffff' : '#18223A', fontSize: 14, fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Render the match status indicator based on match state
   * - Upcoming (NS): Shows kickoff time
   * - Live (1H, 2H, HT, ET): Shows elapsed time with LIVE indicator
   * - Finished (FT, AET, PEN): Shows final status
   */
  const renderMatchStatus = () => {
    if (!match) return null;
    
    const status = match.statusShort?.toUpperCase() || 'NS';
    
    // Live match statuses
    const liveStatuses = ['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'];
    const isLive = liveStatuses.includes(status);
    
    // Half time
    const isHalfTime = status === 'HT';
    
    // Finished statuses
    const finishedStatuses = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
    const isFinished = finishedStatuses.includes(status);
    
    if (isLive) {
      // Live: Show elapsed time with pulsing LIVE badge
      return (
        <View style={styles.liveStatusContainer}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={[styles.matchTimeText, { color: '#ef4444', fontWeight: 'bold' }]}>
            {match.elapsed ? `${match.elapsed}'` : status}
          </Text>
        </View>
      );
    }
    
    if (isHalfTime) {
      // Half Time
      return (
        <View style={styles.liveStatusContainer}>
          <View style={[styles.liveBadge, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.liveText}>HT</Text>
          </View>
          <Text style={[styles.matchTimeText, { color: '#f59e0b' }]}>Half Time</Text>
        </View>
      );
    }
    
    if (isFinished) {
      // Finished: Show status badge
      const statusLabel = status === 'FT' ? 'Full Time' : 
                          status === 'AET' ? 'After Extra Time' :
                          status === 'PEN' ? 'Penalties' :
                          status === 'CANC' ? 'Cancelled' :
                          status === 'PST' ? 'Postponed' :
                          status === 'ABD' ? 'Abandoned' : status;
      return (
        <View style={styles.finishedStatusContainer}>
          <Text style={[styles.matchTimeText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
            {status}
          </Text>
          <Text style={[styles.statusLabelText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            {statusLabel}
          </Text>
        </View>
      );
    }
    
    // Upcoming: Show kickoff time
    return (
      <View style={styles.upcomingStatusContainer}>
        <Text style={[styles.kickoffTimeText, { color: isDark ? '#22c55e' : '#16a34a' }]}>
          {match.kickoffTime}
        </Text>
        <Text style={[styles.statusLabelText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
          Kick-off
        </Text>
      </View>
    );
  };

  const renderDetailsTab = () => (
    <View style={styles.detailsContainer}>
      {/* User Balance */}
      <View style={[
        styles.balanceCard,
        {
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        <Text style={[styles.balanceLabel, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
          Available Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: '#22c55e' }]}>
          {balance} PTS
        </Text>
      </View>

      {/* Betting Card */}
      <View style={[
        styles.bettingCard, 
        { 
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        <Text style={[styles.bettingTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>Who will win?</Text>

        {/* Bet Options */}
        <View style={[styles.betOptionsContainer, { borderWidth: isDark ? 0 : 1, borderColor: '#18223A' }]}>
          <TouchableOpacity
            style={[
              styles.betOption,
              { backgroundColor: isDark ? '#0E1C1C' : '#0E1C1C' },
              betSelection === 'home' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('home')}
          >
            <Text style={styles.betOptionLabel}>HOME</Text>
            <Text style={styles.betOptionOdds}>{match.odds.home}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              { backgroundColor: isDark ? '#080C17' : '#D1D5DB' },
              betSelection === 'draw' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('draw')}
          >
            <Text style={[styles.betOptionLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>DRAW</Text>
            <Text style={[styles.betOptionOdds, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{match.odds.draw}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              styles.betOptionAway,
              betSelection === 'away' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('away')}
          >
            <Text style={[styles.betOptionLabel, styles.betOptionLabelAway]}>AWAY</Text>
            <Text style={[styles.betOptionOdds, styles.betOptionOddsAway]}>{match.odds.away}x</Text>
          </TouchableOpacity>
        </View>

        {/* Stake Input */}
        <Text style={[styles.stakeLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Stake</Text>
        <View style={[
          styles.stakeInputContainer, 
          { 
            backgroundColor: isDark ? '#080C17' : '#F3F4F6',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          <TextInput
            style={[styles.stakeInput, { color: isDark ? '#ffffff' : '#18223A' }]}
            placeholder="Enter your stake"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={stake}
            onChangeText={setStake}
            keyboardType="numeric"
          />
          <Text style={[styles.stakeUnit, { color: isDark ? '#ffffff' : '#18223A' }]}>pts</Text>
        </View>

        {/* Potential Winnings */}
        <View style={[
          styles.potentialWinningsContainer,
          {
            backgroundColor: isDark ? '#0E1C1C' : '#E8F5E9',
            borderColor: isDark ? '#142A28' : '#32A95D',
          }
        ]}>
          <View style={styles.potentialWinningsLeft}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color={isDark ? '#2B5555' : '#32A95D'} />
            <Text style={[styles.potentialWinningsText, { color: isDark ? '#2B5555' : '#32A95D' }]}>Potential Winnings</Text>
          </View>
          <Text style={[styles.potentialWinningsAmount, { color: isDark ? '#22c55e' : '#32A95D' }]}>{potentialWinnings} pts</Text>
        </View>

        {/* Place Bid Button */}
        <TouchableOpacity 
          style={[
            styles.placeBidButton, 
            { backgroundColor: isDark ? '#22c55e' : '#18223A' },
            (submitting || !betSelection || !stake) && { opacity: 0.5 }
          ]} 
          activeOpacity={0.8}
          onPress={async () => {
            if (!betSelection || !stake) {
              Alert.alert('Error', 'Please select an option and enter your stake');
              return;
            }

            // Parse and validate stake
            const stakeTrimmed = stake.trim();
            const stakeNum = parseFloat(stakeTrimmed);
            
            if (!stakeTrimmed || isNaN(stakeNum) || stakeNum <= 0) {
              Alert.alert('Error', 'Please enter a valid stake amount greater than 0');
              return;
            }

            if (stakeNum > balance) {
              Alert.alert('Insufficient Balance', `You only have ${balance} points available`);
              return;
            }

            try {
              setSubmitting(true);
              
              // Validate match and odds exist
              if (!match) {
                setSubmitting(false);
                Alert.alert('Error', 'Match data not loaded. Please wait and try again.');
                return;
              }
              
              if (!match.odds || !match.odds.home || !match.odds.draw || !match.odds.away) {
                setSubmitting(false);
                Alert.alert('Error', 'Odds not available for this match. Please try again later.');
                return;
              }
              
              // Store selection for success message before resetting
              const selectionUpper = betSelection.toUpperCase();
              
              // Get the odds for the selected option
              let selectedOdd: number;
              if (betSelection === 'home') {
                selectedOdd = match.odds.home;
              } else if (betSelection === 'draw') {
                selectedOdd = match.odds.draw;
              } else {
                selectedOdd = match.odds.away;
              }
              
              // Validate odd is a valid number
              if (!selectedOdd || isNaN(selectedOdd) || selectedOdd <= 0) {
                setSubmitting(false);
                Alert.alert('Error', 'Invalid odds. Please refresh the page and try again.');
                return;
              }
              
              // Create accumulator bet with single leg (for details tab)
              const betRequest: BetRequestDTO = {
                stake: stakeNum,
                legs: [{
                  fixtureId: Number(id),
                  marketType: MarketType.MATCH_WINNER,
                  selection: selectionUpper,
                  odd: selectedOdd,
                }],
              };
              
              console.log('[Details Tab] Placing bet with request:', JSON.stringify(betRequest, null, 2));
              console.log('[Details Tab] Match odds:', match.odds);
              console.log('[Details Tab] Selected odd:', selectedOdd);
              
              try {
                const betResponse = await placeBet(betRequest);
                console.log('[Details Tab] Bet placed successfully:', JSON.stringify(betResponse, null, 2));
                
                // Reset form immediately so user can place another bet
                      setBetSelection(null);
                      setStake('');
                
                // Wait a moment for backend transaction to commit, then refresh balance
                await new Promise(resolve => setTimeout(resolve, 500));
                await refetchBalance();
                
                Alert.alert(
                  'Success',
                  `Bet placed successfully!\nSelection: ${selectionUpper}\nStake: ${stakeNum} pts\nPotential Return: ${potentialWinnings} pts\n\nYou can place another bet on this match.`,
                  [{ text: 'OK' }]
                );
              } catch (apiError: any) {
                console.error('[Details Tab] API Error:', apiError);
                console.error('[Details Tab] Error Response:', apiError.response?.data);
                console.error('[Details Tab] Error Status:', apiError.response?.status);
                console.error('[Details Tab] Error Config:', apiError.config);
                throw apiError; // Re-throw to be caught by outer catch
              }
            } catch (error: any) {
              console.error('[Details Tab] Error placing bet:', error);
              const message = error.response?.data?.message || error.message || 'Failed to place bet. Please try again.';
              Alert.alert('Error', `Failed to place bet:\n${message}\n\nPlease check the console for more details.`);
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || !betSelection || !stake}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.placeBidButtonText}>PLACE BID</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Match Info Card */}
      <View style={[
        styles.matchInfoCard,
        {
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        {/* Venue */}
        <View style={[styles.infoRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <MaterialCommunityIcons name="map-marker" size={24} color={isDark ? '#6b7280' : '#18223A'} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.name}</Text>
            <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>{match.venue.location}</Text>
          </View>
        </View>

        {/* Capacity & Surface */}
        <View style={[styles.infoRowDouble, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="account-group" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.capacity}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Capacity</Text>
            </View>
          </View>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="grass" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.surface}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Surface</Text>
            </View>
          </View>
        </View>

        {/* Weather & Temperature - Only show if data is available (predictions API must return weather) */}
        {(match.weather.condition || match.weather.temperature) && (
          <View style={[styles.infoRowDouble, { borderBottomWidth: 0 }]}>
            <View style={styles.infoHalf}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                  {match.weather.condition || 'Unknown'}
                </Text>
                <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Weather</Text>
              </View>
            </View>
            <View style={styles.infoHalf}>
              <MaterialCommunityIcons name="thermometer" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                  {match.weather.temperature || 'Unknown'}
                </Text>
                <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Temperature</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#9ca3af" />;
      case 'own_goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'yellow_card':
        return <View style={[styles.cardIcon, styles.yellowCard]} />;
      case 'red_card':
        return <View style={[styles.cardIcon, styles.redCard]} />;
      case 'two_yellow_card':
  return (
          <View style={styles.twoYellowCard}>
            <View style={[styles.cardIconSmall, styles.yellowCard]} />
            <View style={[styles.cardIconSmall, styles.redCard, styles.cardOverlap]} />
          </View>
        );
      case 'substitution':
        return <MaterialCommunityIcons name="swap-vertical" size={18} color="#22c55e" />;
      case 'penalty_scored':
        return <MaterialCommunityIcons name="soccer" size={16} color="#22c55e" />;
      case 'penalty_missed':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'canceled_goal':
        return <MaterialCommunityIcons name="soccer-field" size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const renderEventRow = (event: MatchEvent) => {
    const isHome = event.team === 'home';
    const isSubstitution = event.type === 'substitution';
    const hasScore = event.score && (event.type === 'goal' || event.type === 'own_goal' || event.type === 'penalty_scored');

    return (
      <View key={event.id} style={[styles.eventRow, { borderBottomColor: isDark ? '#1A253D' : '#E5E7EB' }]}>
        {/* Home team side */}
        <View style={styles.eventSide}>
          {isHome && (
            <View style={styles.eventContent}>
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={[styles.playerNameSubIn, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
                  <Text style={[styles.playerNameSubOut, { color: isDark ? '#919191' : '#6B7280' }]}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={[styles.playerNameSingle, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
              )}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {getEventIcon(event.type)}
            </View>
          )}
        </View>

        {/* Time in center */}
        <Text style={[styles.eventTime, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.time}</Text>

        {/* Away team side */}
        <View style={styles.eventSide}>
          {!isHome && (
            <View style={[styles.eventContent, styles.eventContentAway]}>
              {getEventIcon(event.type)}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={[styles.playerNameSubIn, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
                  <Text style={[styles.playerNameSubOut, { color: isDark ? '#919191' : '#6B7280' }]}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={[styles.playerNameSingle, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Helper to get odds for a prediction selection (legacy, kept for compatibility)
  const getPredictionOdds = (marketType: MarketType, selection: string): number => {
    return getOddsForSelection(marketType, selection);
  };

  // Helper to manage picks
  const updatePick = (marketKey: string, selection: string, line?: number | string, odds?: number) => {
    setSelectedPicks((prev) => {
      // Remove any existing pick for this market (and line if table market)
      const filtered = prev.filter((p) => {
        if (p.marketKey !== marketKey) return true;
        // For table markets, also match by line
        if (line !== undefined && p.line !== line) return true;
        return false;
      });
      // Add new pick
      return [...filtered, { marketKey, selection, line, odds }];
    });
  };

  const removePick = (marketKey: string, line?: number | string) => {
    setSelectedPicks((prev) => {
      return prev.filter((p) => {
        if (p.marketKey !== marketKey) return true;
        if (line !== undefined && p.line !== line) return true;
        return false;
      });
    });
  };

  const isPickSelected = (marketKey: string, selection: string, line?: number | string): boolean => {
    return selectedPicks.some((p) => {
      if (p.marketKey !== marketKey) return false;
      if (p.selection !== selection) return false;
      if (line !== undefined && p.line !== line) return false;
      return true;
    });
  };

  const renderPredictionsTab = () => {
    const handleSubmitPredictions = async () => {
      if (!matchData) {
        Alert.alert('Error', 'Match data not available');
        return;
      }

      // Validate that at least one pick is selected
      if (selectedPicks.length === 0) {
        Alert.alert('No Selection', 'Please select at least one prediction before submitting.');
        return;
      }

      // Validate stake
      const stakeNum = parseFloat(stake);
      if (!stake || isNaN(stakeNum) || stakeNum <= 0) {
        Alert.alert('Invalid Stake', 'Please enter a valid stake amount.');
        return;
      }

      // Check balance - accumulator bet uses single stake amount
      if (balance < stakeNum) {
        Alert.alert('Insufficient Balance', `You need ${stakeNum} PTS but only have ${balance} PTS.`);
        return;
      }

      // Calculate total odds locally (multiply all leg odds)
      const totalOdds = selectedPicks.reduce((acc, pick) => {
        const oddValue = pick.odds ? parseFloat(pick.odds.toString()) : 1.0;
        return acc * (isNaN(oddValue) || oddValue <= 0 ? 1.0 : oddValue);
      }, 1);

      // Create legs array from selected picks
      const legs = selectedPicks.map((pick) => {
        // Map market key to MarketType
        let marketType = MarketType.MATCH_WINNER;
        switch (pick.marketKey) {
          case 'match_winner':
            marketType = MarketType.MATCH_WINNER;
            break;
          case 'double_chance':
            marketType = MarketType.DOUBLE_CHANCE;
            break;
          case 'goals_ou':
            marketType = MarketType.GOALS_OVER_UNDER;
            break;
          case 'btts':
            marketType = MarketType.BOTH_TEAMS_TO_SCORE;
            break;
          case 'handicap_result':
            marketType = MarketType.MATCH_WINNER; // Handicap uses match winner type
            break;
          case 'team_score_first':
            marketType = MarketType.FIRST_TEAM_TO_SCORE;
            break;
          case 'team_score_last':
            marketType = MarketType.FIRST_TEAM_TO_SCORE; // Use same type for last team
            break;
          case 'goals_both_halves':
            marketType = MarketType.BOTH_TEAMS_TO_SCORE; // Approximate mapping
            break;
          case 'team_total_home':
          case 'team_total_away':
            marketType = MarketType.GOALS_OVER_UNDER;
            break;
          default:
            marketType = MarketType.MATCH_WINNER;
        }

        // Format selection string
        let selection = pick.selection;
        if (pick.line !== undefined) {
          // For O/U markets, format as "Over 2.5" or "Under 2.5"
          if (pick.marketKey === 'goals_ou' || pick.marketKey.startsWith('team_total_')) {
            selection = `${pick.selection} ${pick.line}`;
          } else if (pick.marketKey === 'handicap_result') {
            // For handicap, include line in selection
            selection = `${pick.selection} ${pick.line}`;
          }
        }

        // Ensure odd is always a valid number (default to 1.0 if missing)
        const oddValue = pick.odds ? parseFloat(pick.odds.toString()) : 1.0;
        if (isNaN(oddValue) || oddValue <= 0) {
          console.warn(`[Predictions Tab] Invalid odd for pick ${pick.marketKey}: ${pick.odds}, using default 1.0`);
        }
        
        return {
          fixtureId: matchData.fixture.id,
          marketType,
          selection,
          odd: isNaN(oddValue) || oddValue <= 0 ? 1.0 : oddValue,
        };
      });

      // Create accumulator bet request (single ticket with all legs)
      const betRequest: BetRequestDTO = {
        stake: stakeNum,
        legs,
      };

      console.log('[Predictions Tab] Prepared accumulator bet request:', JSON.stringify(betRequest, null, 2));
      console.log('[Predictions Tab] Total odds (calculated locally):', totalOdds.toFixed(2));
      console.log('[Predictions Tab] Potential winnings:', Math.round(stakeNum * totalOdds));

      // Submit single accumulator bet
      setSubmitting(true);
      console.log('[Predictions Tab] Submitting accumulator bet...');
      try {
        const betResponse = await placeBet(betRequest);
        console.log('[Predictions Tab] ✅ Accumulator bet placed successfully:', JSON.stringify(betResponse, null, 2));

          // Reset form immediately so user can place another bet
          setSelectedPicks([]);
          setStake('');

          // Wait a moment for backend transaction to commit, then refresh balance
          await new Promise(resolve => setTimeout(resolve, 500));
          await refetchBalance();

          // Show success message
          const potentialWinnings = betResponse.potentialWinnings || Math.round(stakeNum * totalOdds);
          Alert.alert(
            'Accumulator Bet Placed Successfully!',
            `Your accumulator bet with ${legs.length} leg${legs.length > 1 ? 's' : ''} has been placed.\n\n` +
            `Stake: ${stakeNum} PTS\n` +
            `Total Odds: x${(betResponse.totalOdds || totalOdds).toFixed(2)}\n` +
            `Potential Winnings: ${potentialWinnings} PTS\n\n` +
            `You can place another bet on this match.`,
            [{ text: 'OK' }]
          );
        } catch (error: any) {
          console.error('[Predictions Tab] ❌ Error placing bets:', error);
          console.error('[Predictions Tab] Error response:', error.response?.data);
          console.error('[Predictions Tab] Error status:', error.response?.status);
          console.error('[Predictions Tab] Error config:', error.config);
          const message = error.response?.data?.message || error.message || 'Failed to place bets. Please try again.';
          Alert.alert('Error', `Failed to place bets:\n${message}\n\nPlease check the console for more details.`);
        } finally {
          setSubmitting(false);
        }
    };

    if (oddsLoading) {
    return (
        <View style={[styles.predictionsContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            Loading odds...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.predictionsContainer} 
        contentContainerStyle={styles.predictionsContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Match Result (1X2) - Only show if explicitly enabled */}
        {oddsMarkets.match_winner && predictionSettings !== null && predictionSettings?.whoWillWin !== false && (
        <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, styles.predictionTitleFirst, { color: theme.colors.text }]}>
              MATCH RESULT (1X2)
          </Text>
          <View style={styles.predictionOptions}>
              {oddsMarkets.match_winner.selections.map((sel) => {
                const displayValue = sel.value === 'Home' ? (matchData?.teams?.home?.name || 'HOME') : 
                                   sel.value === 'Draw' ? 'DRAW' : 
                                   (matchData?.teams?.away?.name || 'AWAY');
                const isSelected = isPickSelected('match_winner', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('match_winner');
                      } else {
                        updatePick('match_winner', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
              >
                      {displayValue}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Double Chance - Only show if explicitly enabled */}
        {oddsMarkets.double_chance && predictionSettings !== null && predictionSettings?.doubleChance !== false && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              DOUBLE CHANCE
            </Text>
            <View style={styles.predictionOptions}>
              {oddsMarkets.double_chance.selections.map((sel) => {
                const displayValue = sel.value === '1X' ? 'X1' : sel.value === '12' ? '12' : 'X2';
                const isSelected = isPickSelected('double_chance', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('double_chance');
                      } else {
                        updatePick('double_chance', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
              >
                      {displayValue}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Total Goals O/U - Table - Only show if explicitly enabled */}
        {oddsMarkets.goals_ou && oddsMarkets.goals_ou.isTable && oddsMarkets.goals_ou.tableLines && predictionSettings !== null && predictionSettings?.goalsOverUnder !== false && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              TOTAL GOALS (O/U)
            </Text>
            <View style={styles.oddsTable}>
              <View style={[styles.oddsTableHeader, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>Line</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>OVER</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>UNDER</Text>
              </View>
              {oddsMarkets.goals_ou.tableLines.map((row) => (
                <View key={row.line} style={[styles.oddsTableRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.oddsTableLineText, { color: theme.colors.text }]}>{row.line}</Text>
                  {row.selections.map((sel) => {
                    const isSelected = isPickSelected('goals_ou', sel.value, row.line);
                    return (
            <TouchableOpacity
                        key={sel.value}
              style={[
                          styles.oddsTableCell,
                { backgroundColor: theme.colors.cardBackground },
                          isSelected && styles.oddsTableCellSelected,
              ]}
                        onPress={() => {
                          if (isSelected) {
                            removePick('goals_ou', row.line);
                          } else {
                            updatePick('goals_ou', sel.value, row.line, sel.odd);
                          }
                        }}
            >
              <Text
                style={[
                            styles.oddsTableCellText,
                  { color: theme.colors.text },
                            isSelected && styles.oddsTableCellTextSelected,
                ]}
              >
                          {sel.value}
                        </Text>
                        <Text style={[styles.oddsTableCellOdds, { color: theme.colors.textSecondary }]}>
                          {sel.odd.toFixed(2)}
              </Text>
            </TouchableOpacity>
                    );
                  })}
          </View>
              ))}
        </View>
          </View>
        )}

        {/* Both Teams To Score - Only show if explicitly enabled */}
        {oddsMarkets.btts && predictionSettings !== null && predictionSettings?.bothTeamsScore !== false && (
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            BOTH TEAMS TO SCORE
          </Text>
          <View style={styles.predictionOptions}>
              {oddsMarkets.btts.selections.map((sel) => {
                const displayValue = sel.value.toUpperCase();
                const isSelected = isPickSelected('btts', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('btts');
                      } else {
                        updatePick('btts', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
              >
                      {displayValue}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Goals Handicap - Table - Only show if prediction settings exist (no specific setting for handicap) */}
        {oddsMarkets.handicap_result && oddsMarkets.handicap_result.isTable && oddsMarkets.handicap_result.tableLines && predictionSettings !== null && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              GOALS HANDICAP
            </Text>
            <View style={styles.oddsTable}>
              <View style={[styles.oddsTableHeader, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>Line</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>HOME</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>DRAW</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>AWAY</Text>
              </View>
              {oddsMarkets.handicap_result.tableLines.map((row) => (
                <View key={row.line} style={[styles.oddsTableRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.oddsTableLineText, { color: theme.colors.text }]}>{row.line}</Text>
                  {['HOME', 'DRAW', 'AWAY'].map((outcome) => {
                    const sel = row.selections.find((s) => s.value === outcome);
                    if (!sel) return <View key={outcome} style={styles.oddsTableEmptyCell} />;
                    const isSelected = isPickSelected('handicap_result', sel.value, row.line);
                    return (
            <TouchableOpacity
                        key={outcome}
              style={[
                          styles.oddsTableCell,
                { backgroundColor: theme.colors.cardBackground },
                          isSelected && styles.oddsTableCellSelected,
              ]}
                        onPress={() => {
                          if (isSelected) {
                            removePick('handicap_result', row.line);
                          } else {
                            updatePick('handicap_result', sel.value, row.line, sel.odd);
                          }
                        }}
            >
              <Text
                style={[
                            styles.oddsTableCellText,
                  { color: theme.colors.text },
                            isSelected && styles.oddsTableCellTextSelected,
                ]}
              >
                          {sel.value}
                        </Text>
                        <Text style={[styles.oddsTableCellOdds, { color: theme.colors.textSecondary }]}>
                          {sel.odd.toFixed(2)}
              </Text>
            </TouchableOpacity>
                    );
                  })}
          </View>
              ))}
        </View>
          </View>
        )}

        {/* First Team To Score - Only show if explicitly enabled */}
        {oddsMarkets.team_score_first && predictionSettings !== null && predictionSettings?.firstTeamToScore !== false && (
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            FIRST TEAM TO SCORE
          </Text>
          <View style={styles.predictionOptions}>
              {oddsMarkets.team_score_first.selections.map((sel) => {
                const displayValue = sel.value === 'Home' ? 'HOME' : sel.value === 'Away' ? 'AWAY' : 'NO GOAL';
                const isSelected = isPickSelected('team_score_first', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('team_score_first');
                      } else {
                        updatePick('team_score_first', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
              >
                      {displayValue}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Last Team To Score - Only show if prediction settings exist (no specific setting for last team) */}
        {oddsMarkets.team_score_last && predictionSettings !== null && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              LAST TEAM TO SCORE
            </Text>
            <View style={styles.predictionOptions}>
              {oddsMarkets.team_score_last.selections.map((sel) => {
                const displayValue = sel.value === 'Home' ? 'HOME' : sel.value === 'Away' ? 'AWAY' : 'NO GOAL';
                const isSelected = isPickSelected('team_score_last', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('team_score_last');
                      } else {
                        updatePick('team_score_last', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
              >
                      {displayValue}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
          </View>
        </View>
        )}

        {/* Goals in Both Halves - Estimated - Only show if prediction settings exist */}
        {oddsMarkets.goals_both_halves && predictionSettings !== null && (
        <View style={styles.predictionSection}>
            <View style={styles.predictionTitleRow}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
                GOALS IN BOTH HALVES
          </Text>
              <Text style={[styles.estimatedTag, { color: theme.colors.textSecondary }]}>Estimated</Text>
            </View>
          <View style={styles.predictionOptions}>
              {oddsMarkets.goals_both_halves.selections.map((sel) => {
                const isSelected = isPickSelected('goals_both_halves', sel.value);
                return (
            <TouchableOpacity
                    key={sel.value}
              style={[
                styles.predictionButton,
                      styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                      isSelected && styles.predictionButtonSelected,
              ]}
                    onPress={() => {
                      if (isSelected) {
                        removePick('goals_both_halves');
                      } else {
                        updatePick('goals_both_halves', sel.value, undefined, sel.odd);
                      }
                    }}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                        isSelected && styles.predictionButtonTextSelected,
                ]}
              >
                      {sel.value}
                    </Text>
                    <Text style={[styles.predictionOdds, { color: theme.colors.textSecondary }]}>
                      {sel.odd.toFixed(2)}x
              </Text>
            </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Home Team Total Goals O/U - Only show if prediction settings exist */}
        {oddsMarkets.team_total_home && oddsMarkets.team_total_home.isTable && oddsMarkets.team_total_home.tableLines && predictionSettings !== null && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              HOME TEAM TOTAL GOALS (O/U)
            </Text>
            <View style={styles.oddsTable}>
              <View style={[styles.oddsTableHeader, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>Line</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>OVER</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>UNDER</Text>
              </View>
              {oddsMarkets.team_total_home.tableLines.map((row) => (
                <View key={row.line} style={[styles.oddsTableRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.oddsTableLineText, { color: theme.colors.text }]}>{row.line}</Text>
                  {row.selections.map((sel) => {
                    const isSelected = isPickSelected('team_total_home', sel.value, row.line);
                    return (
            <TouchableOpacity
                        key={sel.value}
              style={[
                          styles.oddsTableCell,
                { backgroundColor: theme.colors.cardBackground },
                          isSelected && styles.oddsTableCellSelected,
              ]}
                        onPress={() => {
                          if (isSelected) {
                            removePick('team_total_home', row.line);
                          } else {
                            updatePick('team_total_home', sel.value, row.line, sel.odd);
                          }
                        }}
            >
              <Text
                style={[
                            styles.oddsTableCellText,
                  { color: theme.colors.text },
                            isSelected && styles.oddsTableCellTextSelected,
                ]}
              >
                          {sel.value}
                        </Text>
                        <Text style={[styles.oddsTableCellOdds, { color: theme.colors.textSecondary }]}>
                          {sel.odd.toFixed(2)}
              </Text>
            </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Away Team Total Goals O/U - Only show if prediction settings exist */}
        {oddsMarkets.team_total_away && oddsMarkets.team_total_away.isTable && oddsMarkets.team_total_away.tableLines && predictionSettings !== null && (
          <View style={styles.predictionSection}>
            <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
              AWAY TEAM TOTAL GOALS (O/U)
            </Text>
            <View style={styles.oddsTable}>
              <View style={[styles.oddsTableHeader, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>Line</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>OVER</Text>
                <Text style={[styles.oddsTableHeaderText, { color: theme.colors.textSecondary }]}>UNDER</Text>
              </View>
              {oddsMarkets.team_total_away.tableLines.map((row) => (
                <View key={row.line} style={[styles.oddsTableRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.oddsTableLineText, { color: theme.colors.text }]}>{row.line}</Text>
                  {row.selections.map((sel) => {
                    const isSelected = isPickSelected('team_total_away', sel.value, row.line);
                    return (
            <TouchableOpacity
                        key={sel.value}
              style={[
                          styles.oddsTableCell,
                { backgroundColor: theme.colors.cardBackground },
                          isSelected && styles.oddsTableCellSelected,
              ]}
                        onPress={() => {
                          if (isSelected) {
                            removePick('team_total_away', row.line);
                          } else {
                            updatePick('team_total_away', sel.value, row.line, sel.odd);
                          }
                        }}
            >
              <Text
                style={[
                            styles.oddsTableCellText,
                  { color: theme.colors.text },
                            isSelected && styles.oddsTableCellTextSelected,
                ]}
              >
                          {sel.value}
                        </Text>
                        <Text style={[styles.oddsTableCellOdds, { color: theme.colors.textSecondary }]}>
                          {sel.odd.toFixed(2)}
              </Text>
            </TouchableOpacity>
                    );
                  })}
          </View>
              ))}
        </View>
          </View>
        )}

        {/* Stake Input */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            STAKE
              </Text>
              <TextInput
                style={[
              styles.stakeInput,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
            placeholder="Enter stake amount"
                placeholderTextColor={theme.colors.textSecondary}
            value={stake}
                onChangeText={(text) => {
              // Only allow numbers and decimal point
              const num = text.replace(/[^0-9.]/g, '');
              // Prevent multiple decimal points
              const parts = num.split('.');
              if (parts.length > 2) return;
              setStake(num);
                }}
            keyboardType="decimal-pad"
              />
          {stake && !isNaN(parseFloat(stake)) && (
            <Text style={[styles.stakeHint, { color: theme.colors.textSecondary }]}>
              Available Balance: {balance} PTS
              </Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitPredictionsButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmitPredictions}
          activeOpacity={0.8}
          disabled={submitting || selectedPicks.length === 0 || !stake}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
          <Text style={styles.submitPredictionsButtonText}>SUBMIT PREDICTIONS</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderSummaryTab = () => {
    // Show empty state if no summary data
    if (!summary || !summary.events || summary.events.length === 0) {
      return (
        <View style={[styles.summaryContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="timeline-alert" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            No match events available
          </Text>
        </View>
      );
    }

    // Split events into first half and second half
    const firstHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time <= 45 || e.time.includes('45+');
    });
    const secondHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time > 45 && !e.time.includes('45+');
    });

    return (
      <View style={styles.summaryContainer}>
        {/* Events Timeline Card */}
        <View style={[
          styles.timelineCard,
          {
            backgroundColor: isDark ? '#101828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Match End Whistle */}
          <View style={[styles.whistleRow, { backgroundColor: isDark ? '#101828' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="whistle" size={24} color={isDark ? '#22c55e' : '#32A95D'} />
          </View>

          {/* Full Time */}
          <View style={[styles.scoreRow, { backgroundColor: isDark ? '#1A253D' : '#D1D5DB' }]}>
            <Text style={[styles.scoreRowText, { color: isDark ? '#ffffff' : '#18223A' }]}>{summary.fulltimeScore} FT</Text>
          </View>

          {/* Second Half Events (reversed to show latest first) */}
          {[...secondHalfEvents].reverse().map((event) => renderEventRow(event))}

          {/* Half Time */}
          <View style={[styles.scoreRow, { backgroundColor: isDark ? '#1A253D' : '#D1D5DB' }]}>
            <Text style={[styles.scoreRowText, { color: isDark ? '#ffffff' : '#18223A' }]}>{summary.halftimeScore} HT</Text>
          </View>

          {/* First Half Events (reversed to show latest first) */}
          {[...firstHalfEvents].reverse().map((event) => renderEventRow(event))}

          {/* Match Start Whistle */}
          <View style={[styles.whistleRow, { backgroundColor: isDark ? '#101828' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="whistle" size={24} color={isDark ? '#22c55e' : '#32A95D'} />
          </View>
        </View>

        {/* Legend Card */}
        <View style={[
          styles.legendCard,
          {
            backgroundColor: isDark ? '#101828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {eventLegend.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              {getEventIcon(item.type)}
              <Text style={[styles.legendText, { color: isDark ? '#ffffff' : '#18223A' }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Helper function to get injury icon based on type
  const getInjuryIcon = (type: string) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('out') || typeLower === 'out') {
      return { name: 'close-circle', color: '#ef4444' }; // Red X icon
    } else if (typeLower.includes('doubtful') || typeLower === 'doubtful') {
      return { name: 'alert-circle', color: '#f97316' }; // Orange alert icon
    } else if (typeLower.includes('questionable') || typeLower === 'questionable') {
      return { name: 'help-circle', color: '#eab308' }; // Yellow question icon
    } else {
      return { name: 'information', color: '#6b7280' }; // Gray info icon (default)
    }
  };

  const renderPlayerNode = (player: Player) => {
    // Defensive coding: ensure player has required fields
    if (!player || !player.id || !player.name) {
      console.warn('[MatchDetails] Invalid player data:', player);
      return null;
    }

    return (
      <TouchableOpacity 
        key={player.id} 
        style={styles.playerNode}
        onPress={() => router.push(`/player/${player.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.playerPhotoContainer}>
        <View style={styles.playerPhoto}>
          {player.photo ? (
            <Image
              source={{ uri: player.photo }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.playerInitial}>{player.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
          {/* FIX: Only show rating if valid (greater than 0) */}
          {player.rating && Number(player.rating) > 0 ? (
            <View style={[styles.playerRating, { backgroundColor: getRatingColor(player.rating) }]}>
          <Text style={styles.playerRatingText}>
                {player.rating.toFixed(1)}
          </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFormationRow = (players: Player[]) => {
    // Defensive coding: handle empty or null arrays
    if (!players || !Array.isArray(players) || players.length === 0) {
      return null;
    }

    return (
      <View style={styles.formationRow}>
        {players.map((player) => renderPlayerNode(player)).filter(Boolean)}
      </View>
    );
  };

  const renderSubstituteCard = (player: Player) => {
    // Defensive coding: ensure player has required fields
    if (!player || !player.id || !player.name) {
      console.warn('[MatchDetails] Invalid substitute data:', player);
      return null;
    }

    return (
      <TouchableOpacity 
        key={player.id} 
        style={[
          styles.substituteCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}
        onPress={() => router.push(`/player/${player.id}` as any)}
        activeOpacity={0.7}
      >
      <View style={[styles.substitutePhoto, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
        {player.photo ? (
          <Image
            source={{ uri: player.photo }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.substituteInitial, { color: isDark ? '#ffffff' : '#18223A' }]}>
            {player.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
        <View style={styles.substituteInfo}>
          <Text style={[styles.substituteName, { color: isDark ? '#ffffff' : '#18223A' }]}>
            {player.name}
          </Text>
          <Text style={[styles.substitutePosition, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
            {player.number || '?'} - {player.position || 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLineupsTab = () => {
    // Check if lineupsData is an array (fallback format) or mapped UI format
    // Fallback format: [homeLineup, awayLineup] where either can be null
    const isArrayFormat = Array.isArray(lineupsData) && lineupsData.length > 0;
    const homeLineupRaw = isArrayFormat && lineupsData[0] ? lineupsData[0] : (Array.isArray(lineupsData) ? lineupsData?.find((l: any) => l && l.team?.id === matchData?.teams?.home?.id) : null);
    const awayLineupRaw = isArrayFormat && lineupsData[1] ? lineupsData[1] : (Array.isArray(lineupsData) ? lineupsData?.find((l: any) => l && l.team?.id === matchData?.teams?.away?.id) : null);

    // Map lineups to UI format if we have raw data
    let homeTeam = null;
    let awayTeam = null;
    
    if (isArrayFormat && matchData && (homeLineupRaw || awayLineupRaw)) {
      // Fallback format: map what we have
      // Filter out null values and ensure each has a team property
      const validLineups = [homeLineupRaw, awayLineupRaw].filter((l): l is any => l !== null && l !== undefined && l && l.team);
      
      if (validLineups.length > 0) {
        // mapLineupsToUI now handles partial lineups (can return null for missing team)
        const mapped = mapLineupsToUI(validLineups, matchData, playerStatsData);
        if (mapped) {
          homeTeam = mapped.homeTeam;
          awayTeam = mapped.awayTeam;
        }
      }
    } else if (lineups && lineups.homeTeam && lineups.awayTeam) {
      // Already in mapped format (official lineups)
      homeTeam = lineups.homeTeam;
      awayTeam = lineups.awayTeam;
    } else if (lineupsData && Array.isArray(lineupsData) && !isArrayFormat && matchData) {
      // Try to map from raw API format (normal case)
      const validLineups = lineupsData.filter((l: any) => l && l.team);
      if (validLineups.length > 0) {
        const mapped = mapLineupsToUI(validLineups, matchData, playerStatsData);
        if (mapped) {
          homeTeam = mapped.homeTeam;
          awayTeam = mapped.awayTeam;
        }
      }
    }

    // Show empty state if no lineup data at all
    if ((!homeTeam && !awayTeam) || (!lineupsData || (isArrayFormat && !homeLineupRaw && !awayLineupRaw))) {
      return (
        <View style={[styles.lineupsContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="account-group-outline" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            Lineups not available yet
          </Text>
        </View>
      );
    }

    // Get coach information from raw lineups data
    const homeCoach = homeLineupRaw?.coach;
    const awayCoach = awayLineupRaw?.coach;
    
    // Filter injuries by team
    const homeInjuries = injuries.filter((injury: FootballApiInjury) => 
      injury.team?.id === matchData?.teams?.home?.id
    );
    const awayInjuries = injuries.filter((injury: FootballApiInjury) => 
      injury.team?.id === matchData?.teams?.away?.id
    );

    return (
      <View style={styles.lineupsContainer}>
        {/* Warning Banner for Projected Lineups */}
        {isProjectedLineup && (
          <View style={[styles.projectedLineupBanner, {
            backgroundColor: isDark ? '#7c2d12' : '#fef3c7',
            borderColor: isDark ? '#9a3412' : '#fde68a',
          }]}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={20} 
              color={isDark ? '#fbbf24' : '#d97706'} 
              style={styles.bannerIcon}
            />
            <Text style={[styles.projectedLineupText, { color: isDark ? '#fbbf24' : '#d97706' }]}>
              Official lineups not available. Showing lineups from previous match.
            </Text>
          </View>
        )}

        {/* Away Team Header */}
        {awayTeam ? (
          <>
        <View style={[
          styles.teamLineupHeader,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }
        ]}>
          <View style={[styles.teamLineupLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            <Text style={[styles.teamLineupLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{awayTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={[styles.teamLineupName, { color: isDark ? '#ffffff' : '#18223A' }]}>{awayTeam.teamName}</Text>
          <Text style={[styles.teamLineupFormation, { color: isDark ? '#B4B4B4' : '#6B7280' }]}>{awayTeam.formation}</Text>
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <ImageBackground
            source={require('@/images/Field.jpg')}
            style={styles.pitchImage}
            resizeMode="cover"
          >
            {/* Away Team (Top - attacking down) */}
                {awayTeam && (
            <View style={styles.teamFormation}>
              {renderFormationRow(awayTeam.starters.goalkeeper)}
              {renderFormationRow(awayTeam.starters.defenders)}
              {renderFormationRow(awayTeam.starters.midfielders)}
              {renderFormationRow(awayTeam.starters.forwards)}
            </View>
                )}

            {/* Home Team (Bottom - attacking up) */}
                {homeTeam && (
            <View style={styles.teamFormation}>
              {renderFormationRow(homeTeam.starters.forwards)}
              {renderFormationRow(homeTeam.starters.midfielders)}
              {renderFormationRow(homeTeam.starters.defenders)}
              {renderFormationRow(homeTeam.starters.goalkeeper)}
            </View>
                )}

                {/* Show message if one team is missing */}
                {!awayTeam && (
                  <View style={[styles.missingLineupMessage, { top: '20%' }]}>
                    <Text style={[styles.missingLineupText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                      Lineups not available yet
                    </Text>
                  </View>
                )}
                {!homeTeam && (
                  <View style={[styles.missingLineupMessage, { bottom: '20%' }]}>
                    <Text style={[styles.missingLineupText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                      Lineups not available yet
                    </Text>
                  </View>
                )}
          </ImageBackground>
        </View>

        {/* Home Team Header */}
            {homeTeam ? (
        <View style={[
          styles.teamLineupHeader,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }
        ]}>
          <View style={[styles.teamLineupLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            <Text style={[styles.teamLineupLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{homeTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={[styles.teamLineupName, { color: isDark ? '#ffffff' : '#18223A' }]}>{homeTeam.teamName}</Text>
          <Text style={[styles.teamLineupFormation, { color: isDark ? '#B4B4B4' : '#6B7280' }]}>{homeTeam.formation}</Text>
        </View>
            ) : (
              <View style={[styles.missingTeamHeader, {
                backgroundColor: isDark ? '#111828' : '#FFFFFF',
                borderWidth: isDark ? 0 : 1,
                borderColor: '#18223A',
              }]}>
                <Text style={[styles.missingLineupText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  Lineups not available yet
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.missingTeamHeader, {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
            borderRadius: 8,
          }]}>
            <Text style={[styles.missingLineupText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
              Lineups not available yet
            </Text>
          </View>
        )}

        {/* Referee Section */}
        {matchData?.fixture?.referee && (
          <View style={[styles.refereesSection, {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>REFEREE</Text>
            <View style={[styles.refereeCard, {
              backgroundColor: isDark ? '#1f2937' : '#F9FAFB',
              borderColor: isDark ? '#374151' : '#E5E7EB',
            }]}>
              <Text style={[styles.refereeName, { color: isDark ? '#ffffff' : '#18223A' }]}>
                {matchData.fixture.referee}
              </Text>
            </View>
          </View>
        )}

        {/* Managers Section */}
        {((homeCoach || awayCoach) && (homeTeam || awayTeam)) && (
          <View style={[styles.managersSection, {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>MANAGERS</Text>
            <View style={styles.managersRow}>
              <View style={[styles.managerCard, { 
                flex: 1,
                backgroundColor: isDark ? '#1f2937' : '#F9FAFB',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              }]}>
                {homeCoach?.photo ? (
                  <Image
                    source={{ uri: homeCoach.photo }}
                    style={styles.managerPhoto}
                    defaultSource={require('@/images/SerieA.jpg')}
                  />
                ) : (
                  <View style={[styles.managerPhoto, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                    <MaterialCommunityIcons name="account" size={24} color={isDark ? '#9ca3af' : '#6B7280'} />
                  </View>
                )}
                <Text style={[styles.managerName, { color: isDark ? '#ffffff' : '#18223A' }]}>
                  {homeCoach?.name || 'N/A'}
                </Text>
              </View>
              <View style={[styles.managerCard, { 
                flex: 1,
                backgroundColor: isDark ? '#1f2937' : '#F9FAFB',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              }]}>
                {awayCoach?.photo ? (
                  <Image
                    source={{ uri: awayCoach.photo }}
                    style={styles.managerPhoto}
                    defaultSource={require('@/images/SerieA.jpg')}
                  />
                ) : (
                  <View style={[styles.managerPhoto, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                    <MaterialCommunityIcons name="account" size={24} color={isDark ? '#9ca3af' : '#6B7280'} />
                  </View>
                )}
                <Text style={[styles.managerName, { color: isDark ? '#ffffff' : '#18223A' }]}>
                  {awayCoach?.name || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Substitutes Section */}
        {(homeTeam || awayTeam) && (
        <View style={styles.substitutesSection}>
          <Text style={[styles.substitutesTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>SUBSTITUTES</Text>
          <View style={styles.substitutesGrid}>
              {/* Left Column - Home Team Substitutes */}
              <View style={{ flex: 1 }}>
                {homeTeam ? (
                  (homeTeam.substitutes || []).map(renderSubstituteCard).filter(Boolean)
                ) : (
                  <Text style={[styles.emptyStateText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                    Lineups not available yet
                  </Text>
                )}
          </View>
              {/* Right Column - Away Team Substitutes */}
              <View style={{ flex: 1 }}>
                {awayTeam ? (
                  (awayTeam.substitutes || []).map(renderSubstituteCard).filter(Boolean)
                ) : (
                  <Text style={[styles.emptyStateText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                    Lineups not available yet
                  </Text>
                )}
        </View>
            </View>
          </View>
        )}

        {/* Injuries & Suspensions Section */}
        {(homeInjuries.length > 0 || awayInjuries.length > 0) && (
          <View style={[styles.injuriesSection, {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>INJURIES & SUSPENSIONS</Text>
            
            {/* Segmented Team Toggle */}
            <View style={[styles.injurySegmentedControl, {
              backgroundColor: isDark ? '#1f2937' : '#F3F4F6',
            }]}>
              <TouchableOpacity
                style={[
                  styles.injurySegment,
                  injuryFilter === 'home' && styles.injurySegmentSelected,
                  injuryFilter === 'home' && {
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  }
                ]}
                onPress={() => setInjuryFilter('home')}
                activeOpacity={0.7}
                accessibilityLabel="Home team injuries"
              >
                <Image
                  source={{ uri: matchData?.teams?.home?.logo || '' }}
                  style={styles.injurySegmentLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.injurySegment,
                  injuryFilter === 'away' && styles.injurySegmentSelected,
                  injuryFilter === 'away' && {
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  }
                ]}
                onPress={() => setInjuryFilter('away')}
                activeOpacity={0.7}
                accessibilityLabel="Away team injuries"
              >
                <Image
                  source={{ uri: matchData?.teams?.away?.logo || '' }}
                  style={styles.injurySegmentLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Single Column - Selected Team Injuries */}
            <View style={styles.injuriesList}>
              {(injuryFilter === 'home' ? homeInjuries : awayInjuries).length > 0 ? (
                (injuryFilter === 'home' ? homeInjuries : awayInjuries).map((injury: FootballApiInjury) => {
                  const icon = getInjuryIcon(injury.player.type || '');
                  return (
                    <TouchableOpacity
                      key={injury.player.id}
                      style={[styles.injuryCard, styles.injuryCardWide, { 
                        backgroundColor: isDark ? '#1f2937' : '#F9FAFB',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                      }]}
                      onPress={() => router.push(`/player/${injury.player.id}` as any)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: injury.player.photo || '' }}
                        style={styles.injuryPhoto}
                        defaultSource={require('@/images/SerieA.jpg')}
                      />
                      <View style={styles.injuryInfo}>
                        <Text 
                          style={[styles.injuryPlayerName, { color: isDark ? '#ffffff' : '#18223A' }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {injury.player.name}
                        </Text>
                        <View style={styles.injuryStatusRow}>
                          <MaterialCommunityIcons 
                            name={icon.name as any} 
                            size={16} 
                            color={icon.color} 
                            style={styles.injuryIcon}
                          />
                          <Text 
                            style={[styles.injuryStatusText, { color: isDark ? '#9ca3af' : '#6B7280' }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {injury.player.reason || injury.player.type || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={[styles.emptyStateText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
                  No injuries reported
                </Text>
              )}
            </View>
          </View>
        )}

      </View>
    );
  };

  const renderStatBar = (homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
    
    const homeIsHigher = homeValue >= awayValue;
    const awayIsHigher = awayValue > homeValue;

    return (
      <View style={styles.statBarContainer}>
        {/* Home bar - grows from left toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackHome, { backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
          <View style={styles.statBarHomeWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarHome,
                { 
                  width: `${homePercent}%`,
                  backgroundColor: homeIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
        {/* Away bar - grows from right toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackAway, { backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
          <View style={styles.statBarAwayWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarAway,
                { 
                  width: `${awayPercent}%`,
                  backgroundColor: awayIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStatsTab = () => {
    // Show empty state if no stats data
    if (!stats) {
      return (
        <View style={[styles.statsContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="chart-bar" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            Match statistics not available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        {/* TOP STATS Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>TOP STATS</Text>

          {/* Ball Possession */}
          <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>Ball possession</Text>
          <View style={[styles.possessionBarContainer, { borderWidth: isDark ? 0 : 1, borderColor: '#18223A' }]}>
            <View style={[styles.possessionBarHome, { flex: stats.possession?.home || 50 }]}>
              <Text style={styles.possessionText}>{stats.possession?.home || 50}%</Text>
            </View>
            <View style={[styles.possessionBarAway, { flex: stats.possession?.away || 50, backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
              <Text style={[styles.possessionText, { color: isDark ? '#ffffff' : '#18223A' }]}>{stats.possession?.away || 50}%</Text>
            </View>
          </View>

          {/* Other Stats */}
          {(stats.topStats || []).map((stat, index) => (
            <View key={`top-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue ?? 0}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name || 'Unknown'}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue ?? 0}</Text>
              </View>
              {renderStatBar(stat.homeValue ?? 0, stat.awayValue ?? 0)}
            </View>
          ))}
        </View>

        {/* SHOTS Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>SHOTS</Text>

          {(stats.shots || []).map((stat, index) => (
            <View key={`shots-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>

        {/* DISCIPLINES Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>DISCIPLINES</Text>

          {(stats.disciplines || []).map((stat, index) => (
            <View key={`disciplines-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderH2HMatchRow = (h2hMatch: H2HMatch) => (
    <View key={h2hMatch.id} style={[styles.h2hMatchRow, { borderTopColor: isDark ? '#202D4B' : '#E5E7EB' }]}>
      {/* Home Team Section: Name + Logo */}
      <View style={styles.h2hTeamLeft}>
        <Text 
          style={[styles.h2hTeamName, { color: isDark ? '#ffffff' : '#18223A' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {h2hMatch.homeTeam}
        </Text>
        <View style={styles.h2hLogoContainer}>
          {h2hMatch.homeTeamLogo ? (
            <Image
              source={{ uri: h2hMatch.homeTeamLogo }}
              style={styles.h2hTeamLogoImage}
              defaultSource={require('@/images/SerieA.jpg')}
            />
          ) : (
        <View style={[styles.h2hTeamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <Text style={[styles.h2hTeamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                {h2hMatch.homeTeam.charAt(0)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Center - Date & Score/Time */}
      <View style={styles.h2hMatchCenter}>
        <Text style={[styles.h2hMatchDate, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.date}</Text>
        {h2hMatch.isCompleted ? (
          <View style={styles.h2hScoreRow}>
            <Text style={[styles.h2hScore, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.homeScore}</Text>
            <Text style={[styles.h2hScoreSeparator, { color: isDark ? '#9ca3af' : '#6B7280' }]}>-</Text>
            <Text style={[styles.h2hScore, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.awayScore}</Text>
          </View>
        ) : (
          <Text style={[styles.h2hTime, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.time}</Text>
        )}
      </View>

      {/* Away Team Section: Logo + Name */}
      <View style={styles.h2hTeamRight}>
        <View style={styles.h2hLogoContainer}>
          {h2hMatch.awayTeamLogo ? (
            <Image
              source={{ uri: h2hMatch.awayTeamLogo }}
              style={styles.h2hTeamLogoImage}
              defaultSource={require('@/images/SerieA.jpg')}
            />
          ) : (
        <View style={[styles.h2hTeamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <Text style={[styles.h2hTeamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                {h2hMatch.awayTeam.charAt(0)}
              </Text>
        </View>
          )}
        </View>
        <Text 
          style={[styles.h2hTeamName, { color: isDark ? '#ffffff' : '#18223A' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {h2hMatch.awayTeam}
        </Text>
      </View>
    </View>
  );

  const renderH2HTab = () => {
    // Show empty state if no H2H data
    if (!h2h || !h2h.matches || h2h.matches.length === 0) {
      return (
        <View style={[styles.h2hContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="history" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            No head-to-head data available
          </Text>
        </View>
      );
    }

    const total = h2h.stats.homeWins + h2h.stats.draws + h2h.stats.awayWins;
    const homePercent = total > 0 ? (h2h.stats.homeWins / total) * 100 : 0;
    const drawPercent = total > 0 ? (h2h.stats.draws / total) * 100 : 0;
    const awayPercent = total > 0 ? (h2h.stats.awayWins / total) * 100 : 0;

    return (
      <View style={styles.h2hContainer}>
        {/* Filter Tabs - Scrollable */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.h2hFilterContainer}
        >
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'meetings' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('meetings')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'meetings' && styles.h2hFilterTextActive
            ]}>
              MEETINGS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'home' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('home')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'home' && styles.h2hFilterTextActive
            ]}>
              {h2h.homeTeam}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'away' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('away')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'away' && styles.h2hFilterTextActive
            ]}>
              {h2h.awayTeam}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Stats Card */}
        <View style={[
          styles.h2hStatsCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Stats Summary */}
          <View style={styles.h2hStatsSummary}>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillHome]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.homeWins}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Won</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, { backgroundColor: isDark ? '#FFFFFF' : '#18223A' }]}>
                <Text style={[styles.h2hStatNumber, { color: isDark ? '#000000' : '#FFFFFF' }]}>{h2h.stats.draws}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Drawn</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillAway]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.awayWins}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Won</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.h2hProgressBar}>
            <View style={[styles.h2hProgressHome, { flex: homePercent }]} />
            <View style={[styles.h2hProgressDraw, { flex: drawPercent, backgroundColor: isDark ? '#FFFFFF' : '#18223A' }]} />
            <View style={[styles.h2hProgressAway, { flex: awayPercent }]} />
          </View>

          {/* Match History */}
          {(h2hShowAll ? filteredH2HMatches : filteredH2HMatches.slice(0, 6)).map(renderH2HMatchRow)}

          {/* See All / Show Less Button */}
          {filteredH2HMatches.length > 6 && (
            <TouchableOpacity style={[styles.h2hSeeAllButton, { borderTopColor: isDark ? '#202D4B' : '#E5E7EB' }]} onPress={() => setH2hShowAll(!h2hShowAll)}>
              <Text style={[styles.h2hSeeAllText, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hShowAll ? 'SHOW LESS' : 'SEE ALL MATCHES'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isTeamPlaying = (teamName: string) => {
    // Check if the team is one of the teams playing in this match
    const homeTeamName = match.homeTeam.name.toLowerCase();
    const awayTeamName = match.awayTeam.name.toLowerCase();
    const checkName = teamName.toLowerCase();
    return checkName.includes(homeTeamName) || homeTeamName.includes(checkName) ||
           checkName.includes(awayTeamName) || awayTeamName.includes(checkName);
  };

  const renderTableRow = (team: TeamStanding) => {
    const isHighlighted = isTeamPlaying(team.teamName);
    
    return (
      <View 
        key={team.position} 
        style={[styles.tableRow, isHighlighted && styles.tableRowHighlighted]}
      >
        <View style={[
          styles.tablePositionCircle, 
          { backgroundColor: isDark ? '#2F384C' : '#E5E7EB' },
          isHighlighted && styles.tablePositionCircleHighlighted
        ]}>
          <Text style={[
            styles.tablePositionText, 
            { color: isDark ? '#ffffff' : '#18223A' },
            isHighlighted && styles.tablePositionTextHighlighted
          ]}>
            {team.position}
          </Text>
        </View>
        <Text style={[
          styles.tableTeamName, 
          { color: isDark ? '#ffffff' : '#18223A' },
          isHighlighted && styles.tableTextHighlighted
        ]}>
          {team.teamName}
        </Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.played}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.won}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.drawn}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.lost}</Text>
        <Text style={[styles.tableGoals, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>
          {team.goalsFor}:{team.goalsAgainst}
        </Text>
        <Text style={[styles.tablePoints, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.points}</Text>
      </View>
    );
  };

  const renderTableTab = () => {
    // Show empty state if no standings data
    if (!table || !table.standings || table.standings.length === 0) {
      return (
        <View style={[styles.tableContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="table" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            Standings not available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        {/* Table Card */}
        <View style={[
          styles.tableCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Filter Tabs */}
          <View style={[styles.tableFilterContainer, { borderBottomColor: isDark ? '#222F4E' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#FFFFFF' },
                tableFilter === 'all' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('all')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'all' && styles.tableFilterTextActive
              ]}>
                ALL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#E5E7EB' },
                tableFilter === 'home' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('home')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'home' && styles.tableFilterTextActive
              ]}>
                HOME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#E5E7EB' },
                tableFilter === 'away' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('away')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'away' && styles.tableFilterTextActive
              ]}>
                AWAY
              </Text>
            </TouchableOpacity>
          </View>

          {/* League Title */}
          <Text style={[styles.tableLeagueTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>{table.leagueName}</Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: isDark ? '#2F384C' : '#E5E7EB' }]}>
            <Text style={[styles.tableHeaderPosition, { color: isDark ? '#485C88' : '#6B7280' }]}>#</Text>
            <Text style={[styles.tableHeaderTeam, { color: isDark ? '#485C88' : '#6B7280' }]}>Team</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>P</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>W</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>D</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>L</Text>
            <Text style={[styles.tableHeaderGoals, { color: isDark ? '#485C88' : '#6B7280' }]}>Goals</Text>
            <Text style={[styles.tableHeaderPoints, { color: isDark ? '#485C88' : '#6B7280' }]}>PTS</Text>
          </View>

          {/* Table Rows */}
          {(table.standings || []).map(renderTableRow)}
        </View>
      </View>
    );
  };

  const renderPowerTab = () => {
    if (!powerData) {
      return (
        <View style={[styles.powerContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="chart-line" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            Power data not available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.powerContainer}>
        {/* Team Balance Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>TEAM BALANCE</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            A chart comparing two team's strength and performance
          </Text>
          <TeamBalanceChart
            data={powerData.teamBalance}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>

        {/* Separator */}
        <View style={[styles.powerSeparator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB' }]} />

        {/* Team Power Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>TEAM POWER</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            Comparison of the team's power based on past matches
          </Text>
          <TeamPowerChart
            data={powerData.teamPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>

        {/* Separator */}
        <View style={[styles.powerSeparator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB' }]} />

        {/* Goal Power Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>GOAL POWER</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            A chart that display's the timing of the goals scored during a match showing when each team found the net
          </Text>
          <GoalPowerChart
            data={powerData.goalPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>
      </View>
    );
  };

  const renderCommentaryItem = (item: CommentaryItem) => (
    <View key={item.id} style={[
      styles.commentaryCard,
      {
        backgroundColor: isDark ? '#111828' : '#FFFFFF',
        borderWidth: isDark ? 0 : 1,
        borderColor: '#18223A',
      }
    ]}>
      <View style={[styles.commentaryTimeBadge, { backgroundColor: isDark ? '#ffffff' : '#18223A' }]}>
        <Text style={[styles.commentaryTimeText, { color: isDark ? '#000000' : '#FFFFFF' }]}>{item.time}</Text>
      </View>
      <Text style={[styles.commentaryText, { color: isDark ? '#ffffff' : '#18223A' }]}>{item.text}</Text>
    </View>
  );

  const renderCommentaryTab = () => {
    if (!commentary.items || commentary.items.length === 0) {
      return (
        <View style={[styles.commentaryContainer, { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }]}>
          <MaterialCommunityIcons name="comment-text-outline" size={48} color={isDark ? '#9ca3af' : '#6B7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 16, fontSize: 14 }}>
            Commentary not available yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.commentaryContainer}>
        {commentary.items.map(renderCommentaryItem)}
      </View>
    );
  };

  const renderPlaceholderTab = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Coming Soon</Text>
    </View>
  );

  const renderSettingsTab = () => {
    if (!id) return null;
    const fixtureId = parseInt(id);
    if (isNaN(fixtureId)) return null;
    return <AdminMatchSettings fixtureId={fixtureId} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6' }]}>
      {/* Header & Score Section with Gradient */}
      <LinearGradient
        colors={isDark ? ['#202D4B', '#111828', '#080C17'] : ['#FFFFFF', '#FFFFFF', '#F3F4F6']}
        locations={[0, 0.4, 1]}
        style={styles.gradientHeader}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#ffffff' : '#18223A'} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.leagueName, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{match.league}</Text>
            <Text style={[styles.matchDate, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.date}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? '#22c55e' : (isDark ? '#ffffff' : '#18223A')}
            />
          </TouchableOpacity>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamContainer}>
            <View style={styles.teamLogoContainer}>
              {match.homeTeam.logo ? (
                <Image
                  source={{ uri: match.homeTeam.logo }}
                  style={styles.teamLogoImage}
                  defaultSource={require('@/images/SerieA.jpg')}
                />
              ) : (
            <View style={[styles.teamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.teamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                    {match.homeTeam.name.charAt(0)}
                  </Text>
            </View>
              )}
            </View>
            <Text 
              style={[styles.teamName, { color: isDark ? '#ffffff' : '#18223A' }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {match.homeTeam.name}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            {/* Show "vs" for upcoming, score for live/finished */}
            {matchStatus === 'upcoming' ? (
              <Text style={[styles.scoreText, { color: isDark ? '#ffffff' : '#18223A', fontSize: 32 }]}>
                vs
              </Text>
            ) : (
              <Text style={[styles.scoreText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                {match.homeScore} - {match.awayScore}
              </Text>
            )}
            {/* Dynamic Match Status Display */}
            {renderMatchStatus()}
          </View>

          <View style={styles.teamContainer}>
            <View style={styles.teamLogoContainer}>
              {match.awayTeam.logo ? (
                <Image
                  source={{ uri: match.awayTeam.logo }}
                  style={styles.teamLogoImage}
                  defaultSource={require('@/images/SerieA.jpg')}
                />
              ) : (
            <View style={[styles.teamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
                  <Text style={[styles.teamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>
                    {match.awayTeam.name.charAt(0)}
                  </Text>
            </View>
              )}
            </View>
            <Text 
              style={[styles.teamName, { color: isDark ? '#ffffff' : '#18223A' }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {match.awayTeam.name}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB', backgroundColor: isDark ? 'transparent' : '#FFFFFF' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {availableTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? '#6b7280' : '#6B7280' },
                  selectedTab === tab.id && [styles.tabTextSelected, { color: isDark ? '#ffffff' : '#18223A' }],
                ]}
              >
                {tab.label}
              </Text>
              {selectedTab === tab.id && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#22c55e' : '#32A95D' }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={[styles.contentScrollView, { backgroundColor: isDark ? '#080C17' : '#F3F4F6' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTab === 'details' && renderDetailsTab()}
        {selectedTab === 'predictions' && renderPredictionsTab()}
        {selectedTab === 'summary' && (
          // For live games: summary tab shows commentary content
          // For finished games: summary tab shows summary content (but summary tab is hidden in finished)
          matchStatus === 'live' ? renderCommentaryTab() : renderSummaryTab()
        )}
        {selectedTab === 'lineups' && renderLineupsTab()}
        {selectedTab === 'stats' && renderStatsTab()}
        {selectedTab === 'h2h' && renderH2HTab()}
        {selectedTab === 'table' && renderTableTab()}
        {selectedTab === 'power' && renderPowerTab()}
        {selectedTab === 'commentary' && (
          // For finished games: commentary tab shows summary content
          // For live games: commentary tab shows commentary content (but commentary tab is hidden in live)
          matchStatus === 'finished' ? renderSummaryTab() : renderCommentaryTab()
        )}
        {selectedTab === 'settings' && renderSettingsTab()}
        {/* Fallback for any unhandled tab */}
        {!['details', 'predictions', 'summary', 'lineups', 'stats', 'h2h', 'table', 'power', 'commentary', 'settings'].includes(selectedTab) && renderPlaceholderTab()}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  gradientHeader: {
    paddingBottom: 0,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  matchDate: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: '40%', // Prevent long team names from breaking layout
  },
  teamLogoContainer: {
    width: 64, // Fixed width for logo container
    height: 64, // Fixed height for logo container
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamLogoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  teamLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoText: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    textAlign: 'center',
    maxWidth: '100%', // Prevent overflow
    flexShrink: 1, // Allow text to shrink if needed
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  matchTimeText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 4,
  },
  // Match Status Styles
  liveStatusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  finishedStatusContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingStatusContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  kickoffTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusLabelText: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Tab Navigation
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  tabTextSelected: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  // Content
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  // Betting Card
  bettingCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  bettingTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 16,
  },
  betOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  betOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  betOptionDefault: {
    backgroundColor: '#0E1C1C',
  },
  betOptionDraw: {
    backgroundColor: '#080C17',
  },
  betOptionAway: {
    backgroundColor: '#3FAC66',
  },
  betOptionSelected: {
    borderColor: '#24C45F',
  },
  betOptionLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  betOptionLabelAway: {
    color: '#ffffff',
  },
  betOptionOdds: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#9ca3af',
    marginTop: 2,
  },
  betOptionOddsAway: {
    color: '#ffffff',
  },
  stakeLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 8,
  },
  stakeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080C17',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stakeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  stakeUnit: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  potentialWinningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1C1C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#142A28',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  potentialWinningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  potentialWinningsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#2B5555',
  },
  potentialWinningsAmount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#22c55e',
  },
  placeBidButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeBidButtonText: {
    fontSize: 15,
    fontFamily: 'Montserrat_900Black',
    color: '#ffffff',
  },
  // Match Info Card
  matchInfoCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: 12,
  },
  infoRowDouble: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  infoHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoValueText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  infoLabelText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#B3B3B3',
    marginTop: 2,
  },
  // Placeholder
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  // Summary Tab
  summaryContainer: {
    gap: 16,
  },
  timelineCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    overflow: 'hidden',
  },
  whistleRow: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#101828',
  },
  scoreRow: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1A253D',
  },
  scoreRowText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A253D',
  },
  eventSide: {
    flex: 1,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  eventContentAway: {
    justifyContent: 'flex-start',
  },
  eventTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
    width: 50,
    textAlign: 'center',
  },
  playerNameSingle: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  substitutionNames: {
    alignItems: 'flex-end',
  },
  playerNameSubIn: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  playerNameSubOut: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#919191',
  },
  scoreBadge: {
    backgroundColor: '#24C45F',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  cardIcon: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  cardIconSmall: {
    width: 10,
    height: 14,
    borderRadius: 2,
  },
  yellowCard: {
    backgroundColor: '#fbbf24',
  },
  redCard: {
    backgroundColor: '#ef4444',
  },
  twoYellowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOverlap: {
    marginLeft: -6,
  },
  // Legend
  legendCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  // Lineups Tab
  lineupsContainer: {
    gap: 0,
  },
  teamLineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  teamLineupLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLineupLogoText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamLineupName: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  teamLineupFormation: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#B4B4B4',
    flex: 1,
  },
  teamLineupRating: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  teamLineupRatingText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#000000',
  },
  // Football Pitch
  pitchContainer: {
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  pitchImage: {
    width: '100%',
    aspectRatio: 0.7,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamFormation: {
    paddingVertical: 2,
  },
  formationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  playerNode: {
    alignItems: 'center',
  },
  playerPhotoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  playerRating: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerRatingText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Substitutes
  substitutesSection: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  substitutesTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    marginBottom: 12,
  },
  substitutesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  substituteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  substitutePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteInitial: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substitutePosition: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 2,
  },
  // Managers Section
  managersSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
  managersRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  managerCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  managerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerName: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  // Injuries Section
  injuriesSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  injurySegmentedControl: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 6,
    marginTop: 12,
    marginBottom: 16,
    height: 48,
    alignItems: 'center',
    width: '100%',
  },
  injurySegment: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 36,
  },
  injurySegmentSelected: {
    // Background color is applied inline based on theme
  },
  injurySegmentLogo: {
    width: 24,
    height: 24,
  },
  injuriesList: {
    marginTop: 0,
  },
  injuriesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  injuryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 64,
  },
  injuryCardWide: {
    width: '100%',
  },
  injuryPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  injuryInfo: {
    flex: 1,
    minWidth: 0,
  },
  injuryPlayerName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 6,
    flexShrink: 1,
  },
  injuryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  injuryIcon: {
    marginRight: 2,
    flexShrink: 0,
  },
  injuryStatusText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    flex: 1,
    flexShrink: 1,
    lineHeight: 16,
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Projected Lineup Banner
  projectedLineupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  bannerIcon: {
    marginRight: 4,
  },
  projectedLineupText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  // Missing Lineup Messages
  missingLineupMessage: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  missingLineupText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  },
  missingTeamHeader: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  // Referees Section
  refereesSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
  refereeCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  refereeName: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  // Stats Tab
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#080C17',
    borderWidth: 1,
    borderColor: '#1A253D',
    borderRadius: 12,
    padding: 16,
  },
  statsCardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Possession Bar
  possessionBarContainer: {
    flexDirection: 'row',
    height: 25,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  possessionBarHome: {
    backgroundColor: '#3FAC66',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  possessionBarAway: {
    backgroundColor: '#111828',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  // Stat Rows
  statRow: {
    marginBottom: 16,
  },
  statRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statName: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    width: 30,
  },
  statValueRight: {
    textAlign: 'right',
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 15,
    gap: 8,
  },
  statBarTrack: {
    flex: 1,
    height: 15,
    backgroundColor: '#111828',
    overflow: 'hidden',
  },
  statBarTrackHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarTrackAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  statBarHomeWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statBarAwayWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statBar: {
    height: 15,
  },
  statBarHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  // H2H Tab
  h2hContainer: {
    gap: 16,
  },
  h2hFilterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  h2hFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  h2hFilterTabActive: {
    backgroundColor: '#32A95D',
    borderColor: '#32A95D',
  },
  h2hFilterText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hFilterTextActive: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  h2hStatsCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  h2hStatsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  h2hStatItem: {
    alignItems: 'center',
  },
  h2hStatPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  h2hStatPillHome: {
    backgroundColor: '#2A50CD',
  },
  h2hStatPillDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hStatPillAway: {
    backgroundColor: '#D3473B',
  },
  h2hStatNumber: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hStatNumberDark: {
    color: '#000000',
  },
  h2hStatLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hProgressBar: {
    flexDirection: 'row',
    height: 8,
    marginBottom: 20,
  },
  h2hProgressHome: {
    backgroundColor: '#2A50CD',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  h2hProgressDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hProgressAway: {
    backgroundColor: '#D3473B',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  h2hMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hTeamLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 0, // Allow flexbox to shrink
    paddingRight: 4, // Reduced padding to bring logo closer to center
  },
  h2hTeamRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-start',
    minWidth: 0, // Allow flexbox to shrink
    paddingLeft: 4, // Reduced padding to bring logo closer to center
  },
  h2hLogoContainer: {
    width: 32, // Fixed width for logo container
    height: 32, // Fixed height for logo container
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent logo container from shrinking
  },
  h2hTeamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
    flexShrink: 1, // Allow text to shrink if needed
    minWidth: 0, // Allow text to shrink below content size
    maxWidth: 100, // Limit width to prevent overflow
  },
  h2hTeamNameInline: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
    maxWidth: 80, // Limit width to prevent overflow
    flexShrink: 1,
  },
  h2hTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2hTeamLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  h2hTeamLogoText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hMatchCenter: {
    flex: 0, // Don't take extra space, just fit content
    alignItems: 'center',
    paddingHorizontal: 4, // Reduced padding to bring score closer to logos
    minWidth: 0, // Allow flexbox to shrink
  },
  h2hMatchDate: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 4,
  },
  h2hScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  h2hScoreSeparator: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    marginHorizontal: 4,
  },
  h2hScore: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginTop: 4,
  },
  h2hSeeAllButton: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hSeeAllText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Table Tab
  tableContainer: {
    gap: 16,
  },
  tableFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222F4E',
    marginBottom: 16,
  },
  tableFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  tableFilterTabActive: {
    backgroundColor: '#3FAC66',
  },
  tableFilterText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  tableFilterTextActive: {
    color: '#ffffff',
  },
  tableCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  tableLeagueTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F384C',
  },
  tableHeaderPosition: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderTeam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
  },
  tableHeaderStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderPoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableRowHighlighted: {
    backgroundColor: '#3FAC66',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tablePositionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2F384C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tablePositionCircleHighlighted: {
    backgroundColor: '#ffffff',
  },
  tablePositionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  tablePositionTextHighlighted: {
    color: '#000000',
  },
  tableTeamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  tableStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tablePoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableTextHighlighted: {
    color: '#ffffff',
  },
  // Commentary Tab
  commentaryContainer: {
    gap: 12,
  },
  commentaryCard: {
    backgroundColor: '#111828',
    borderRadius: 5,
    padding: 16,
  },
  commentaryTimeBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  commentaryTimeText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#000000',
  },
  commentaryText: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    lineHeight: 22,
  },
  // Power Tab
  powerContainer: {
    gap: 0,
  },
  powerSection: {
    paddingVertical: 20,
  },
  powerSectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  powerSectionDescription: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginBottom: 20,
  },
  powerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Predictions Tab
  predictionsContainer: {
    paddingBottom: 20,
  },
  predictionsContentContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  predictionSection: {
    marginBottom: 22,
    gap: 12,
  },
  predictionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 12,
  },
  predictionTitleFirst: {
    marginTop: 0,
  },
  predictionOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
  },
  predictionButtonWide: {
    flex: 1,
  },
  predictionButtonSelected: {
    backgroundColor: '#22c55e',
  },
  predictionButtonText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 1,
  },
  predictionOdds: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 6,
  },
  predictionButtonTextSelected: {
    color: '#ffffff',
  },
  scoreInputsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreInputWrapper: {
    flex: 1,
    gap: 8,
  },
  scoreInputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  scoreInput: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    borderWidth: 1,
  },
  stakeHint: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 8,
  },
  submitPredictionsButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitPredictionsButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#22c55e',
  },
  // Odds Table Styles
  oddsTable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  oddsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  oddsTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
  },
  oddsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  oddsTableLineText: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
  },
  oddsTableCell: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    minHeight: 52,
  },
  oddsTableCellSelected: {
    backgroundColor: '#22c55e',
  },
  oddsTableCellText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  oddsTableCellTextSelected: {
    color: '#ffffff',
  },
  oddsTableCellOdds: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
  },
  oddsTableEmptyCell: {
    flex: 1,
    marginHorizontal: 4,
  },
  // Prediction Title Row (for Estimated tag)
  predictionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  estimatedTag: {
    fontSize: 10,
    fontFamily: 'Montserrat_400Regular',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
});
