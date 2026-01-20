import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import api from '@/services/api';
import { getStandings } from '@/services/matchApi';
import { mapStandingsToUI } from '@/utils/matchDataMapper';
import { FootballApiFixture } from '@/types/fixture';

type TabType = 'matches' | 'table';
type FilterType = 'all' | 'home' | 'away';

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag?: string;
}

interface MatchGroup {
  date: string;
  matches: FootballApiFixture[];
}

export default function CompetitionViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const leagueId = typeof id === 'string' ? id : '';

  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);
  const [matches, setMatches] = useState<FootballApiFixture[]>([]);
  const [standings, setStandings] = useState<any>(null);

  // Fetch league info and matches
  useEffect(() => {
    if (leagueId) {
      fetchCompetitionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      
      // First, try to fetch league info from leagues endpoint
      try {
        const leaguesResponse = await api.get('/football/leagues', {
          params: { id: leagueId }
        });
        
        if (leaguesResponse.data?.response && leaguesResponse.data.response.length > 0) {
          const leagueData = leaguesResponse.data.response[0].league;
          setLeagueInfo({
            id: leagueData.id,
            name: leagueData.name,
            country: leagueData.country,
            logo: leagueData.logo,
            flag: leagueData.flag,
          });
        }
      } catch (err) {
        console.error('Error fetching league info:', err);
      }
      
      // Fetch fixtures for the league - try 2026 first, fallback to 2025
      let fixtures: FootballApiFixture[] = [];
      try {
        const fixturesResponse = await api.get('/football/fixtures', {
          params: { league: leagueId, season: 2026 }
        });

        if (fixturesResponse.data?.response && fixturesResponse.data.response.length > 0) {
          fixtures = fixturesResponse.data.response as FootballApiFixture[];
        } else {
          // Fallback to 2025 if 2026 has no data
          console.log('No fixtures for 2026, trying 2025...');
          const fixturesResponse2025 = await api.get('/football/fixtures', {
            params: { league: leagueId, season: 2025 }
          });
          if (fixturesResponse2025.data?.response && fixturesResponse2025.data.response.length > 0) {
            fixtures = fixturesResponse2025.data.response as FootballApiFixture[];
          }
        }
      } catch (err) {
        console.error('Error fetching fixtures:', err);
        // Try 2025 as fallback
        try {
          const fixturesResponse2025 = await api.get('/football/fixtures', {
            params: { league: leagueId, season: 2025 }
          });
          if (fixturesResponse2025.data?.response && fixturesResponse2025.data.response.length > 0) {
            fixtures = fixturesResponse2025.data.response as FootballApiFixture[];
          }
        } catch (err2) {
          console.error('Error fetching fixtures for 2025:', err2);
        }
      }

      setMatches(fixtures);

      // If we don't have league info yet, extract from first fixture
      if (fixtures.length > 0 && fixtures[0]?.league) {
        setLeagueInfo((prev) => {
          // Only update if we don't already have league info
          if (prev) return prev;
          return {
            id: fixtures[0].league.id,
            name: fixtures[0].league.name,
            country: fixtures[0].league.country,
            logo: fixtures[0].league.logo,
            flag: fixtures[0].league.flag,
          };
        });
      }

      // Fetch standings - try 2026 first, fallback to 2025
      try {
        let standingsData = await getStandings(Number(leagueId), 2026);
        if (!standingsData || standingsData.length === 0) {
          // Fallback to 2025
          standingsData = await getStandings(Number(leagueId), 2025);
        }
        setStandings(standingsData);
      } catch (err) {
        console.error('Error fetching standings for 2026, trying 2025:', err);
        try {
          const standingsData2025 = await getStandings(Number(leagueId), 2025);
          setStandings(standingsData2025);
        } catch (err2) {
          console.error('Error fetching standings for 2025:', err2);
        }
      }
    } catch (error) {
      console.error('Error fetching competition data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompetitionData();
  };

  // Group matches by date
  const groupedMatches = useMemo(() => {
    const groups: MatchGroup[] = [];
    const dateMap = new Map<string, FootballApiFixture[]>();

    matches.forEach((match) => {
      const matchDate = new Date(match.fixture.date);
      const dateKey = matchDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(match);
    });

    // Sort dates and create groups
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    sortedDates.forEach((date) => {
      const matchesForDate = dateMap.get(date)!;
      // Sort matches by time
      matchesForDate.sort((a, b) => {
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
      });
      groups.push({ date, matches: matchesForDate });
    });

    return groups;
  }, [matches]);

  // Filter matches based on filter type
  const filteredMatches = useMemo(() => {
    if (filter === 'all') return groupedMatches;

    return groupedMatches.map((group) => ({
      ...group,
      matches: group.matches.filter((match) => {
        // For home filter, we'd need to know which team is "home" in context
        // Since we're viewing a competition, we'll filter based on league context
        // For now, return all matches (this can be enhanced later)
        return true;
      }),
    })).filter((group) => group.matches.length > 0);
  }, [groupedMatches, filter]);

  // Get filtered standings
  const filteredStandings = useMemo(() => {
    if (!standings) return null;

    const mapped = mapStandingsToUI(standings);
    if (!mapped || !mapped.standings) return null;

    if (filter === 'all') return mapped;

    // For home/away filters, we need to re-map with filtered stats
    const leagueData = standings[0]?.league;
    const standingsData = leagueData?.standings?.[0];

    if (!standingsData) return mapped;

    const filtered = standingsData.map((team: any) => {
      const stats = filter === 'home' ? team.home : team.away;

      if (!stats) {
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

      const points = (stats.win * 3) + (stats.draw * 1);
      return {
        position: 0,
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

    // Sort by points, goal difference, goals for
    filtered.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGoalDiff = a.goalsFor - a.goalsAgainst;
      const bGoalDiff = b.goalsFor - b.goalsAgainst;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
      return b.goalsFor - a.goalsFor;
    });

    filtered.forEach((team: any, index: number) => {
      team.position = index + 1;
    });

    return {
      leagueName: mapped.leagueName,
      standings: filtered,
    };
  }, [standings, filter]);

  const isLeagueFavorite = leagueInfo ? isFavorite('competition', leagueInfo.id) : false;

  const handleToggleFavorite = () => {
    if (leagueInfo) {
      toggleFavorite('competition', {
        id: leagueInfo.id,
        name: leagueInfo.name,
        imageUrl: leagueInfo.logo,
        country: leagueInfo.country,
        type: 'competition',
      });
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getMatchStatus = (statusShort: string) => {
    const status = statusShort?.toUpperCase() || 'NS';
    const liveStatuses = ['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'];
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    
    if (liveStatuses.includes(status)) return 'live';
    if (finishedStatuses.includes(status)) return 'finished';
    return 'upcoming';
  };

  const renderMatchCard = (match: FootballApiFixture) => {
    const status = getMatchStatus(match.fixture.status.short);
    const isLive = status === 'live';
    const isFinished = status === 'finished';

    return (
      <TouchableOpacity
        key={match.fixture.id}
        style={[
          styles.matchCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => router.push(`/match/${match.fixture.id}`)}
        activeOpacity={0.7}
      >
        {/* Time / Status */}
        <View style={styles.matchTimeContainer}>
          {isLive ? (
            <View style={[styles.liveIndicator, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : isFinished ? (
            <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>FT</Text>
          ) : (
            <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
              {formatMatchTime(match.fixture.date)}
            </Text>
          )}
        </View>

        {/* Teams */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            {match.teams.home.logo ? (
              <Image source={{ uri: match.teams.home.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.teams.home.name}
            </Text>
            {(isLive || isFinished) && match.goals.home !== null && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                {match.goals.home}
              </Text>
            )}
          </View>
          <View style={styles.teamRow}>
            {match.teams.away.logo ? (
              <Image source={{ uri: match.teams.away.logo }} style={styles.teamLogo} />
            ) : (
              <View style={[styles.teamLogo, { backgroundColor: theme.colors.textMuted }]} />
            )}
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.teams.away.name}
            </Text>
            {(isLive || isFinished) && match.goals.away !== null && (
              <Text style={[styles.scoreText, { color: theme.colors.text }]}>
                {match.goals.away}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMatchesTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading matches...
          </Text>
        </View>
      );
    }

    if (filteredMatches.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No matches found
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {filteredMatches.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.dateSection}>
            <Text style={[styles.dateHeader, { color: theme.colors.text }]}>{group.date}</Text>
            {group.matches.map((match) => renderMatchCard(match))}
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  const renderTableTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading standings...
          </Text>
        </View>
      );
    }

    if (!filteredStandings || !filteredStandings.standings || filteredStandings.standings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No standings available
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={[styles.tableContainer, { backgroundColor: isDark ? '#111828' : '#FFFFFF', borderColor: theme.colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: theme.colors.separator }]}>
            <Text style={[styles.tableHeaderText, styles.tableCellRank, { color: theme.colors.textSecondary }]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.tableCellTeam, { color: theme.colors.textSecondary }]}>Team</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>P</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>W</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>D</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>L</Text>
            <Text style={[styles.tableHeaderText, styles.tableCellGoals, { color: theme.colors.textSecondary }]}>Goals</Text>
            <Text style={[styles.tableHeaderText, styles.tableCellPoints, { color: theme.colors.textSecondary }]}>PTS</Text>
          </View>

          {/* Table Rows */}
          {filteredStandings.standings.map((team: any, index: number) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.separator },
                index === filteredStandings.standings.length - 1 && styles.tableRowLast,
              ]}
            >
              <Text style={[styles.tableCellText, styles.tableCellRank, { color: theme.colors.text }]}>
                {team.position}
              </Text>
              <Text
                style={[styles.tableCellText, styles.tableCellTeam, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {team.teamName}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCell, { color: theme.colors.text }]}>
                {team.played}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCell, { color: theme.colors.text }]}>
                {team.won}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCell, { color: theme.colors.text }]}>
                {team.drawn}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCell, { color: theme.colors.text }]}>
                {team.lost}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCellGoals, { color: theme.colors.text }]}>
                {team.goalsFor}:{team.goalsAgainst}
              </Text>
              <Text style={[styles.tableCellText, styles.tableCellPoints, { color: theme.colors.text }]}>
                {team.points}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="chevron-left" size={24} color={theme.colors.icon} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {leagueInfo?.logo && (
              <Image source={{ uri: leagueInfo.logo }} style={styles.leagueLogo} />
            )}
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {leagueInfo?.name || 'Competition'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
            <MaterialCommunityIcons
              name={isLeagueFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isLeagueFavorite ? theme.colors.primary : theme.colors.icon}
            />
          </TouchableOpacity>
        </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.headerBackground, borderBottomColor: theme.colors.separator }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
          onPress={() => setActiveTab('matches')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'matches' ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            MATCHES
          </Text>
          {activeTab === 'matches' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'table' && styles.tabActive]}
          onPress={() => setActiveTab('table')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'table' ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            TABLE
          </Text>
          {activeTab === 'table' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters - Only show for TABLE tab */}
      {activeTab === 'table' && (
        <View style={[styles.filterContainer, { backgroundColor: theme.colors.headerBackground }]}>
          {(['all', 'home', 'away'] as FilterType[]).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && [
                  styles.filterButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
                filter !== filterType && {
                  backgroundColor: isDark ? '#1f2937' : '#F3F4F6',
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      filter === filterType
                        ? '#FFFFFF'
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {filterType.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      {activeTab === 'matches' ? renderMatchesTab() : renderTableTab()}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  leagueLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
  },
  dateSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchTimeContainer: {
    width: 60,
    alignItems: 'center',
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 20,
    textAlign: 'right',
  },
  tableContainer: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellText: {
    fontSize: 13,
  },
  tableCellRank: {
    width: 30,
    textAlign: 'center',
  },
  tableCellTeam: {
    flex: 1,
    marginLeft: 8,
  },
  tableCell: {
    width: 30,
    textAlign: 'center',
  },
  tableCellGoals: {
    width: 60,
    textAlign: 'center',
  },
  tableCellPoints: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});

