import {
  DateOption,
  filterLeaguesByStatus,
  generateDates,
  League,
  Match,
  mockLeagues,
} from '@/mock/homeData';
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
        <Text style={[styles.dateDayText, isSelected && styles.dateDayTextSelected]}>
          {item.dayName}
        </Text>
        <Text style={[styles.dateMonthText, isSelected && styles.dateMonthTextSelected]}>
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
        style={styles.matchItem}
        onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}
        activeOpacity={0.7}
      >
        {/* Time / Live indicator */}
        <View style={styles.matchTimeContainer}>
          {match.status === 'live' ? (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <Text style={styles.matchTime}>{match.time}</Text>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <View style={styles.teamLogo} />
            <Text style={styles.teamName}>{match.homeTeam.name}</Text>
            {match.status === 'live' && (
              <Text style={styles.scoreText}>{match.homeScore}</Text>
            )}
          </View>
          <View style={styles.teamRow}>
            <View style={styles.teamLogo} />
            <Text style={styles.teamName}>{match.awayTeam.name}</Text>
            {match.status === 'live' && (
              <Text style={styles.scoreText}>{match.awayScore}</Text>
            )}
          </View>
        </View>

        {/* Bets */}
        <View style={[styles.betsContainer, isHot && styles.betsContainerHot]}>
          {isHot && (
            <MaterialCommunityIcons name="fire" size={16} color="#FFF04E" />
          )}
          <Text style={[styles.betsText, isHot && styles.betsTextHot]}>
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
            color={isFavorite ? '#22c55e' : '#6b7280'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderLeagueCard = (league: League) => {
    const isExpanded = expandedLeagues.has(league.id);

    return (
      <View key={league.id} style={styles.leagueCard}>
        {/* League Header */}
        <TouchableOpacity
          style={styles.leagueHeader}
          onPress={() => toggleLeague(league.id)}
          activeOpacity={0.7}
        >
          <Image source={league.logo} style={styles.leagueLogo} />
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueName}>{league.name}</Text>
            <Text style={styles.leagueCountry}>{league.country}</Text>
          </View>
          <View style={styles.leagueSeparator} />
          <View style={styles.matchCountContainer}>
            <Text style={styles.matchCountDot}>•</Text>
            <Text style={styles.matchCountText}>{league.matches.length} matches</Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#6b7280"
          />
        </TouchableOpacity>

        {/* Matches */}
        {isExpanded && (
          <View style={styles.matchesContainer}>
            {league.matches.map(renderMatchItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoFyp}>FYP</Text>
          <Text style={styles.logoScore}> SCORE</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Feather name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <View style={styles.liveLogoContainer}>
          <Text style={styles.liveLogo}>LIVE</Text>
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
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            ALL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'live' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('live')}
        >
          <Text style={[styles.filterText, selectedFilter === 'live' && styles.filterTextActive]}>
            LIVE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('upcoming')}
        >
          <Text style={[styles.filterText, selectedFilter === 'upcoming' && styles.filterTextActive]}>
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
