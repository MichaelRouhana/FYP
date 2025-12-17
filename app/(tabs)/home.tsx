import {
  DateOption,
  filterLeaguesByStatus,
  generateDates,
  League,
  Match,
  mockLeagues,
} from '@/mock/homeData';
import { useTheme } from '@/context/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterType = 'all' | 'live' | 'upcoming';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>('date-0'); // Today
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set(['seria-1']));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const dates = useMemo(() => generateDates(), []);

  const filteredLeagues = useMemo(
    () => filterLeaguesByStatus(mockLeagues, selectedFilter),
    [selectedFilter]
  );

  const toggleLeague = useCallback((leagueId: string) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  }, []);

  const toggleFavorite = useCallback((matchId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
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

  const renderMatchItem = (match: Match) => {
    const isHot = match.betsCount >= 100;
    const isFavorite = favorites.has(match.id);

  return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchItem, { borderBottomColor: theme.colors.separator }]}
        onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}
        activeOpacity={0.7}
      >
        {/* Time / Live indicator */}
        <View style={styles.matchTimeContainer}>
          {match.status === 'live' ? (
            <View style={[styles.liveIndicator, { backgroundColor: isDark ? '#1f2937' : '#18223A' }]}>
              <Text style={[styles.liveText, { color: '#ffffff' }]}>LIVE</Text>
            </View>
          ) : (
            <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>{match.time}</Text>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>{match.homeTeam.name}</Text>
            {match.status === 'live' && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>{match.homeScore}</Text>
            )}
          </View>
          <View style={styles.teamRow}>
            <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            <Text style={[styles.teamName, { color: theme.colors.text }]}>{match.awayTeam.name}</Text>
            {match.status === 'live' && (
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

  const renderLeagueCard = (league: League) => {
    const isExpanded = expandedLeagues.has(league.id);

    return (
      <View key={league.id} style={[styles.leagueCard, { backgroundColor: theme.colors.cardBackground, borderWidth: isDark ? 0 : 1, borderColor: theme.colors.border }]}>
        {/* League Header */}
        <TouchableOpacity
          style={styles.leagueHeader}
          onPress={() => toggleLeague(league.id)}
          activeOpacity={0.7}
        >
          <Image source={league.logo} style={styles.leagueLogo} />
          <View style={styles.leagueInfo}>
            <Text style={[styles.leagueName, { color: theme.colors.text }]}>{league.name}</Text>
            <Text style={[styles.leagueCountry, { color: theme.colors.textMuted }]}>{league.country}</Text>
          </View>
          <View style={[styles.leagueSeparator, { backgroundColor: theme.colors.separator }]} />
          <View style={styles.matchCountContainer}>
            <Text style={[styles.matchCountDot, { color: theme.colors.primary }]}>•</Text>
            <Text style={[styles.matchCountText, { color: theme.colors.textMuted }]}>{league.matches.length} matches</Text>
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
      </View>

      {/* League Cards */}
      <ScrollView
        style={styles.leaguesScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.leaguesContent}
      >
        {filteredLeagues.map(renderLeagueCard)}
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
});
