import {
  DateOption,
  generateDates,
} from '@/mock/homeData';
import { useTheme } from '@/context/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { FixtureViewDTO, UILeague, UIMatch } from '@/types/fixture';

type FilterType = 'all' | 'live' | 'upcoming' | 'finished';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>('date-0'); // Today
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leagues, setLeagues] = useState<UILeague[]>([]);

  const dates = useMemo(() => generateDates(), []);

  // Fetch fixtures from backend on initial load
  useEffect(() => {
    fetchFixtures();
  }, []);

  // Refresh when screen comes into focus (navigating back to Home)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we already have data (not initial load)
      if (leagues.length > 0) {
        fetchFixtures(true); // Silent refresh
      }
    }, [leagues.length])
  );

  const fetchFixtures = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const response = await api.get<FixtureViewDTO[]>('/fixtures/public');
      const fixtures = response.data;
      
      console.log(`[HomeScreen] Fetched ${fixtures.length} fixtures`);
      
      // Transform backend data to UI format
      const transformedLeagues = transformFixturesToLeagues(fixtures);
      setLeagues(transformedLeagues);
      
      // Auto-expand first league if any exist (only on initial load)
      if (!silent && transformedLeagues.length > 0) {
        setExpandedLeagues(new Set([String(transformedLeagues[0].id)]));
      }
    } catch (error) {
      console.error('Failed to fetch fixtures:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFixtures(true);
  }, []);

  // Transform FixtureViewDTO[] to UILeague[]
  const transformFixturesToLeagues = (fixtures: FixtureViewDTO[]): UILeague[] => {
    const leagueMap = new Map<number, UILeague>();

    fixtures.forEach((fixture) => {
      const rawJson = fixture.rawJson;
      const leagueId = rawJson.league.id;

      // Determine match status
      const statusShort = rawJson.fixture.status.short;
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
      
      if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(statusShort)) {
        status = 'live';
      } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
        status = 'finished';
      }

      // Format time
      let timeDisplay: string;
      if (status === 'live') {
        timeDisplay = rawJson.fixture.status.elapsed ? `${rawJson.fixture.status.elapsed}'` : 'LIVE';
      } else if (status === 'finished') {
        timeDisplay = 'FT';
      } else {
        // Format time from ISO date
        const date = new Date(rawJson.fixture.date);
        timeDisplay = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }

      const match: UIMatch = {
        // Use the Football-API fixture ID, not the backend database ID
        id: rawJson.fixture.id,
        homeTeam: {
          name: rawJson.teams.home.name,
          logo: rawJson.teams.home.logo,
        },
        awayTeam: {
          name: rawJson.teams.away.name,
          logo: rawJson.teams.away.logo,
        },
        time: timeDisplay,
        status,
        statusShort: statusShort, // Include statusShort for postponed detection
        homeScore: rawJson.goals.home ?? undefined,
        awayScore: rawJson.goals.away ?? undefined,
        betsCount: fixture.bets,
        date: rawJson.fixture.date,
        leagueId: rawJson.league.id,
        leagueName: rawJson.league.name,
      };

      // Group by league
      if (!leagueMap.has(leagueId)) {
        leagueMap.set(leagueId, {
          id: leagueId,
          name: rawJson.league.name,
          country: rawJson.league.country,
          logo: rawJson.league.logo,
          matches: [],
        });
      }

      leagueMap.get(leagueId)!.matches.push(match);
    });

    return Array.from(leagueMap.values());
  };

  // Get the actual date object for the selected date
  const selectedDateObj = useMemo(() => {
    const dateOption = dates.find(d => d.id === selectedDate);
    return dateOption?.date || new Date();
  }, [selectedDate, dates]);

  const filteredLeagues = useMemo(() => {
    // Helper to check if a match date matches the selected date
    const isSameDay = (matchDateStr: string, targetDate: Date): boolean => {
      const matchDate = new Date(matchDateStr);
      return (
        matchDate.getFullYear() === targetDate.getFullYear() &&
        matchDate.getMonth() === targetDate.getMonth() &&
        matchDate.getDate() === targetDate.getDate()
      );
    };

    return leagues
      .map((league) => ({
        ...league,
        matches: league.matches.filter((match) => {
          // First filter by date
          const matchesDate = isSameDay(match.date, selectedDateObj);
          if (!matchesDate) return false;
          
          // Then filter by status (all/live/upcoming/finished)
          if (selectedFilter === 'all') return true;
          return match.status === selectedFilter;
        }),
      }))
      .filter((league) => league.matches.length > 0);
  }, [leagues, selectedFilter, selectedDateObj]);

  const toggleLeague = useCallback((leagueId: number) => {
    const leagueIdStr = String(leagueId);
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueIdStr)) {
        newSet.delete(leagueIdStr);
      } else {
        newSet.add(leagueIdStr);
      }
      return newSet;
    });
  }, []);

  const toggleFavorite = useCallback((matchId: number) => {
    const matchIdStr = String(matchId);
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchIdStr)) {
        newSet.delete(matchIdStr);
      } else {
        newSet.add(matchIdStr);
      }
      return newSet;
    });
  }, []);

  const renderDateItem = (item: DateOption) => {
    const isSelected = item.id === selectedDate;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dateItem}
        onPress={() => setSelectedDate(item.id)}
      >
        <Text style={[
          styles.dateDayText, 
          { color: theme.colors.textMuted },
          isSelected && [styles.dateDayTextSelected, { color: theme.colors.text }]
        ]}>
          {item.dayName}
        </Text>
        <Text style={[
          styles.dateMonthText, 
          { color: theme.colors.textMuted },
          isSelected && [styles.dateMonthTextSelected, { color: theme.colors.text }]
        ]}>
          {item.monthDay}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMatchItem = (match: UIMatch) => {
    const isHot = match.betsCount >= 100;
    const isFavorite = favorites.has(String(match.id));

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchItem, { borderBottomColor: theme.colors.separator }]}
        onPress={() => router.push({ pathname: '/match/[id]', params: { id: String(match.id) } })}
        activeOpacity={0.7}
      >
        {/* Time / Live indicator */}
        <View style={styles.matchTimeContainer}>
          {match.status === 'live' ? (
            <View style={[styles.liveIndicator, { backgroundColor: isDark ? '#1f2937' : '#18223A' }]}>
              <Text style={[styles.liveText, { color: '#ffffff' }]}>LIVE</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>{match.time}</Text>
              {match.statusShort === 'PST' && (
                <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>Postponed</Text>
              )}
            </View>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            {match.homeTeam.logo ? (
              <Image source={{ uri: match.homeTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            {(match.status === 'live' || match.status === 'finished') && match.homeScore !== undefined && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>{match.homeScore}</Text>
            )}
          </View>
          <View style={styles.teamRow}>
            {match.awayTeam.logo ? (
              <Image source={{ uri: match.awayTeam.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            {(match.status === 'live' || match.status === 'finished') && match.awayScore !== undefined && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>{match.awayScore}</Text>
            )}
          </View>
        </View>

        {/* Bets */}
        <View style={[
          styles.betsContainer, 
          isHot && [
            styles.betsContainerHot, 
            { 
              backgroundColor: isDark ? '#111828' : '#FFF04E',
              borderColor: isDark ? '#FFF04E' : '#FFF04E'
            }
          ]
        ]}>
          {isHot && (
            <MaterialCommunityIcons name="fire" size={16} color={isDark ? '#FFF04E' : '#18223A'} />
          )}
          <Text style={[
            styles.betsText, 
            { color: theme.colors.textSecondary }, 
            isHot && [styles.betsTextHot, { color: isDark ? '#FFF04E' : '#18223A' }]
          ]}>
            {match.betsCount} BETS
          </Text>
        </View>

        {/* Favorite */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(match.id)}
        >
          <MaterialCommunityIcons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? theme.colors.primary : theme.colors.iconMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderLeagueCard = (league: UILeague) => {
    const isExpanded = expandedLeagues.has(String(league.id));

    return (
      <View key={league.id} style={[styles.leagueCard, { backgroundColor: theme.colors.cardBackground, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border }]}>
        {/* League Header */}
        <TouchableOpacity
          style={styles.leagueHeader}
          onPress={() => toggleLeague(league.id)}
          activeOpacity={0.7}
        >
          {league.logo ? (
            <Image source={{ uri: league.logo }} style={styles.leagueLogo} />
          ) : (
            <View style={[styles.leagueLogo, { backgroundColor: theme.colors.textMuted }]} />
          )}
          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]} numberOfLines={1}>
              {league.name}
            </Text>
            <Text style={[styles.leagueCountry, { color: theme.colors.textMuted }]}>
              {league.country}
            </Text>
          </View>
          <View style={[styles.leagueSeparator, { backgroundColor: theme.colors.separator }]} />
          <View style={styles.matchCountContainer}>
            <Text style={[styles.matchCountDot, { color: theme.colors.primary }]}>•</Text>
            <Text style={[styles.matchCountText, { color: theme.colors.textMuted }]}>
              {league.matches.length} {league.matches.length === 1 ? 'match' : 'matches'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.iconMuted}
          />
        </TouchableOpacity>

        {/* Matches */}
        {isExpanded && (
          <View style={[styles.matchesContainer, { borderTopColor: theme.colors.separator }]}>
            {league.matches.map(renderMatchItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color={theme.colors.icon} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoFyp, { color: theme.colors.primary }]}>FYP</Text>
          <Text style={[styles.logoScore, { color: theme.colors.text }]}> SCORE</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Feather name="search" size={24} color={theme.colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={[styles.dateNavigation, { borderBottomColor: theme.colors.separator, backgroundColor: theme.colors.headerBackground }]}>
        <View style={[styles.liveLogoContainer, { backgroundColor: isDark ? '#ffffff' : '#18223A' }]}>
          <Text style={[styles.liveLogo, { color: isDark ? '#000000' : '#ffffff' }]}>LIVE</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContainer}
        >
          {dates.map(renderDateItem)}
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[
            styles.filterTab, 
            { backgroundColor: theme.colors.filterInactive, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border },
            selectedFilter === 'all' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.colors.text },
            selectedFilter === 'all' && { color: theme.colors.primaryText }
          ]}>
            ALL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab, 
            { backgroundColor: theme.colors.filterInactive, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border },
            selectedFilter === 'live' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedFilter('live')}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.colors.text },
            selectedFilter === 'live' && { color: theme.colors.primaryText }
          ]}>
            LIVE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab, 
            { backgroundColor: theme.colors.filterInactive, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border },
            selectedFilter === 'upcoming' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedFilter('upcoming')}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.colors.text },
            selectedFilter === 'upcoming' && { color: theme.colors.primaryText }
          ]}>
            UPCOMING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab, 
            { backgroundColor: theme.colors.filterInactive, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border },
            selectedFilter === 'finished' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedFilter('finished')}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.colors.text },
            selectedFilter === 'finished' && { color: theme.colors.primaryText }
          ]}>
            FINISHED
          </Text>
        </TouchableOpacity>
      </View>

      {/* League Cards */}
      <ScrollView
        style={styles.leaguesScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaguesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Loading matches...
            </Text>
          </View>
        ) : filteredLeagues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="soccer" 
              size={64} 
              color={theme.colors.textMuted} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No matches available
            </Text>
          </View>
        ) : (
          filteredLeagues.map(renderLeagueCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoFyp: {
    fontSize: 20,
    fontFamily: 'Montserrat_900Black_Italic',
    color: '#22c55e',
  },
  logoScore: {
    fontSize: 20,
    fontFamily: 'Montserrat_900Black_Italic',
    color: '#ffffff',
  },
  searchButton: {
    padding: 4,
  },
  // Date Navigation
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  liveLogoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 16,
  },
  liveLogo: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#000000',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  dateItem: {
    alignItems: 'center',
  },
  dateDayText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#374B78',
  },
  dateDayTextSelected: {
    fontSize: 13,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  dateMonthText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#374B78',
  },
  dateMonthTextSelected: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111828',
  },
  filterTabActive: {
    backgroundColor: '#22c55e',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  filterTextActive: {
    color: '#000000',
  },
  // League Cards
  leaguesScrollView: {
    flex: 1,
  },
  leaguesContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  leagueCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leagueLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  leagueInfo: {
    marginLeft: 12,
  },
  leagueName: {
    fontSize: 13,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  leagueCountry: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#334369',
  },
  leagueSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#374151',
    marginHorizontal: 16,
  },
  matchCountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCountDot: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#22c55e',
    marginRight: 4,
  },
  matchCountText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#334369',
  },
  // Match Item
  matchesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  matchTimeContainer: {
    width: 50,
    alignItems: 'center',
  },
  matchTime: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ACB1BD',
    textAlign: 'center',
  },
  liveIndicator: {
    backgroundColor: '#1f2937',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamsContainer: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  scoreText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  betsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 2,
    marginLeft: 12,
  },
  betsContainerHot: {
    backgroundColor: '#111828',
    borderWidth: 1,
    borderColor: '#FFF04E',
    borderRadius: 3,
  },
  betsText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#9ca3af',
  },
  betsTextHot: {
    color: '#FFF04E',
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
});
