import { Stack, useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTeamHeader, getTeamStandings, getTeamTrophies, TeamHeaderDTO, StandingRow as ApiStandingRow } from '@/services/teamApi';

type TabType = 'DETAILS' | 'STANDINGS' | 'SQUAD' | 'STATS';
type TrophyFilter = 'MAJOR' | 'ALL';

interface Trophy {
  name: string;
  count: number;
  isMajor?: boolean;
}

interface StandingRow {
  rank: number;
  team: string;
  teamLogo?: string;
  mp: number; // Matches Played
  w: number;  // Wins
  d: number;  // Draws
  l: number;  // Losses
  gd: number; // Goal Difference
  pts: number; // Points
  isCurrent: boolean;
}

interface TeamData {
  name: string;
  logo: string;
  country: string;
  countryFlag?: string;
  coach: string;
  coachImageUrl?: string;
  founded: string;
  stadium?: string;
  uefaRank: number | null;
  tournaments: Array<{ name: string; logo?: string }>;
  trophies: Trophy[];
}

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [trophyFilter, setTrophyFilter] = useState<TrophyFilter>('MAJOR');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('la_liga');
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'ALL' | 'HOME' | 'AWAY'>('ALL');
  const [loading, setLoading] = useState(true);
  const [teamHeader, setTeamHeader] = useState<TeamHeaderDTO | null>(null);
  const [standings, setStandings] = useState<ApiStandingRow[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);

  // Fetch real data from API
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const teamId = typeof id === 'string' ? parseInt(id) : 0;
      if (isNaN(teamId) || teamId === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch team header
        const headerData = await getTeamHeader(teamId);
        setTeamHeader(headerData);

        // Fetch standings
        console.log('Fetching standings for team ID:', teamId);
        const standingsData = await getTeamStandings(teamId, 2023);
        // Ensure standings is always an array
        setStandings(Array.isArray(standingsData) ? standingsData : []);

        // Fetch trophies
        const trophiesData = await getTeamTrophies(teamId);
        // Map trophies to local format
        const mappedTrophies: Trophy[] = Array.isArray(trophiesData)
          ? trophiesData.map((t) => ({
              name: t.leagueName,
              count: 1, // Backend returns individual trophies, we'll group them later if needed
              isMajor: t.isMajor,
            }))
          : [];
        setTrophies(mappedTrophies);
      } catch (error) {
        console.error('Error fetching team data:', error);
        // Set defaults on error
        setStandings([]);
        setTrophies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [id]);

  const tabs: TabType[] = ['DETAILS', 'STANDINGS', 'SQUAD', 'STATS'];
  const teamId = typeof id === 'string' ? parseInt(id) : 0;
  const isTeamFavorite = isFavorite('team', teamId);

  // Get gradient colors based on theme
  const getGradientColors = () => {
    if (isDark) {
      return ['#1a1f2e', '#111828', '#080C17'];
    }
    return ['#f8fafc', '#ffffff', '#f3f4f6'];
  };

  // Filter trophies based on selected filter
  const filteredTrophies = teamData?.trophies.filter(trophy => 
    trophyFilter === 'MAJOR' ? trophy.isMajor : true
  ) || [];

  // Mock leagues for filter (can be replaced with API call later)
  const availableLeagues = [
    { id: 'la_liga', name: 'La Liga' },
    { id: 'ucl', name: 'Champions League' },
    { id: 'copa', name: 'Copa del Rey' },
  ];

  // Get base standings and apply filter - Using real API data with safe fallback
  const currentStandings = useMemo(() => {
    // CRITICAL: Safe access - ensure we always have an array
    // Array.isArray check prevents crash if standings is undefined or not an array
    const safeStandings: ApiStandingRow[] = Array.isArray(standings) ? standings : [];
    
    // If filter is ALL, return the standings as-is
    if (filterType === 'ALL') {
      return safeStandings;
    }
    
    // For HOME/AWAY, modify the stats (placeholder logic until backend provides home/away data)
    return safeStandings.map((team) => {
      if (filterType === 'HOME') {
        // Simulate home stats (slightly better performance)
        return {
          ...team,
          mp: Math.floor(team.mp / 2),
          w: Math.floor(team.w / 2) + (team.w % 2),
          pts: Math.floor(team.pts / 2) + (team.pts % 2),
        };
      } else {
        // Simulate away stats
        return {
          ...team,
          mp: Math.floor(team.mp / 2),
          w: Math.floor(team.w / 2),
          pts: Math.floor(team.pts / 2),
        };
      }
    });
    
    // If filter is ALL, return the copy as-is
    if (filterType === 'ALL') {
      return baseStandings;
    }
    
    // For HOME/AWAY, modify the stats
    return baseStandings.map((team) => {
      if (filterType === 'HOME') {
        // Simulate home stats (slightly better performance)
        return {
          rank: team.rank,
          team: team.team,
          teamLogo: team.teamLogo,
          mp: Math.floor(team.mp / 2),
          w: Math.floor(team.w / 2) + (team.w % 2),
          d: team.d,
          l: team.l,
          gd: team.gd,
          pts: Math.floor(team.pts / 2) + (team.pts % 2),
          isCurrent: team.isCurrent,
        };
      } else {
        // Simulate away stats
        return {
          rank: team.rank,
          team: team.team,
          teamLogo: team.teamLogo,
          mp: Math.floor(team.mp / 2),
          w: Math.floor(team.w / 2),
          d: team.d,
          l: team.l,
          gd: team.gd,
          pts: Math.floor(team.pts / 2),
          isCurrent: team.isCurrent,
        };
      }
    });
  }, [standings, filterType]);

  const selectedLeague = availableLeagues.find(l => l.id === selectedLeagueId) || availableLeagues[0];

  // Map teamHeader to TeamData format for compatibility
  const teamData: TeamData | null = teamHeader ? {
    name: teamHeader.name,
    logo: teamHeader.logo,
    country: teamHeader.country,
    countryFlag: undefined, // Can be added if backend provides it
    coach: teamHeader.coachName,
    coachImageUrl: teamHeader.coachImageUrl,
    founded: teamHeader.foundedYear?.toString() || '',
    stadium: teamHeader.stadiumName,
    uefaRank: teamHeader.uefaRanking || null,
    tournaments: [], // Can be fetched separately if needed
    trophies: trophies,
  } : null;

  const handleToggleFavorite = () => {
    if (teamData) {
      toggleFavorite('team', {
        id: teamId,
        name: teamData.name,
        imageUrl: teamData.logo,
        type: 'team',
      });
    }
  };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading team data...</Text>
        </View>
      </View>
    );
  }

  if (!teamData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Team not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header - Horizontal Layout */}
      <View style={[
        styles.customHeader,
        { 
          backgroundColor: theme.colors.headerBackground,
          paddingTop: insets.top,
        }
      ]}>
        {/* Back Button */}
        <TouchableOpacity 
          style={[styles.headerBackButton, { backgroundColor: 'transparent' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.icon} />
        </TouchableOpacity>

        {/* Team Logo */}
        <View style={[styles.headerLogoContainer, { backgroundColor: 'transparent' }]}>
          {teamData.logo ? (
            <Image 
              source={{ uri: teamData.logo }} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
          ) : (
            <View style={[styles.headerLogoPlaceholder, { backgroundColor: theme.colors.border }]}>
              <Text style={[styles.headerLogoPlaceholderText, { color: theme.colors.text }]}>
                {teamData.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Team Name and Country */}
        <View style={[styles.headerInfo, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.headerTeamName, { color: theme.colors.text }]} numberOfLines={1}>
            {teamData.name}
          </Text>
          <View style={[styles.headerCountryRow, { backgroundColor: 'transparent' }]}>
            {teamData.countryFlag && (
              <Text style={styles.headerCountryFlag}>{teamData.countryFlag}</Text>
            )}
            <Text style={[styles.headerCountryName, { color: theme.colors.textSecondary }]}>
              {teamData.country}
            </Text>
          </View>
        </View>

        {/* Star Button */}
        <TouchableOpacity 
          style={[styles.headerStarButton, { backgroundColor: 'transparent' }]}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isTeamFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isTeamFavorite ? theme.colors.primary : theme.colors.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Custom Segmented Control Tabs */}
      <View style={[styles.tabBar, { 
        backgroundColor: isDark ? 'transparent' : theme.colors.headerBackground,
        borderBottomColor: theme.colors.separator,
      }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { 
                    color: activeTab === tab 
                      ? theme.colors.text 
                      : theme.colors.textSecondary + '99',
                    fontFamily: activeTab === tab 
                      ? 'Montserrat_700Bold' 
                      : 'Montserrat_500Medium',
                  },
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'DETAILS' ? (
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Section 1: Team Information Card */}
          <View style={[styles.card, { 
            backgroundColor: theme.colors.cardBackground,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Team Information</Text>
            <View style={styles.infoList}>
              {/* Coach */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border, overflow: 'hidden' }]}>
                  {teamData.coachImageUrl ? (
                    <Image 
                      source={{ uri: teamData.coachImageUrl }} 
                      style={styles.coachImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={24} color={theme.colors.primary} />
                  )}
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COACH</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.coach}</Text>
                </View>
              </View>

              {/* Country */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
                  {teamData.countryFlag ? (
                    <Text style={styles.infoFlagIcon}>{teamData.countryFlag}</Text>
                  ) : (
                    <Ionicons name="flag" size={24} color={theme.colors.primary} />
                  )}
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COUNTRY</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.country}</Text>
                </View>
              </View>

              {/* Founded */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
                  <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
                </View>
              </View>

              {/* UEFA Ranking */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
                  <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>UEFA RANKING</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {teamData.uefaRank ? `${teamData.uefaRank}st` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 2: Major Trophies with Sub-Tabs */}
          <View style={[styles.card, { 
            backgroundColor: theme.colors.cardBackground,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Major Trophies</Text>
            
            {/* Trophy Filter Tabs */}
            <View style={styles.trophyFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.trophyFilterTab,
                  trophyFilter === 'MAJOR' && [
                    styles.trophyFilterTabActive,
                    { backgroundColor: isDark ? theme.colors.text : '#FFFFFF' }
                  ],
                ]}
                onPress={() => setTrophyFilter('MAJOR')}
              >
                <Text
                  style={[
                    styles.trophyFilterText,
                    { 
                      color: trophyFilter === 'MAJOR' 
                        ? (isDark ? '#000' : theme.colors.text)
                        : theme.colors.textSecondary,
                      fontFamily: trophyFilter === 'MAJOR' 
                        ? 'Montserrat_700Bold' 
                        : 'Montserrat_500Medium',
                    },
                  ]}
                >
                  MAJOR TROPHIES
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.trophyFilterTab,
                  trophyFilter === 'ALL' && [
                    styles.trophyFilterTabActive,
                    { backgroundColor: isDark ? theme.colors.text : '#FFFFFF' }
                  ],
                ]}
                onPress={() => setTrophyFilter('ALL')}
              >
                <Text
                  style={[
                    styles.trophyFilterText,
                    { 
                      color: trophyFilter === 'ALL' 
                        ? (isDark ? '#000' : theme.colors.text)
                        : theme.colors.textSecondary,
                      fontFamily: trophyFilter === 'ALL' 
                        ? 'Montserrat_700Bold' 
                        : 'Montserrat_500Medium',
                    },
                  ]}
                >
                  ALL TROPHIES
                </Text>
              </TouchableOpacity>
            </View>

            {/* Trophy List */}
            <View style={styles.trophyList}>
              {filteredTrophies.map((trophy, index) => (
                <View key={index} style={styles.trophyRow}>
                  <View style={styles.trophyRowLeft}>
                    <MaterialCommunityIcons 
                      name="trophy" 
                      size={24} 
                      color="#FFD700" 
                    />
                    <Text style={[styles.trophyRowName, { color: theme.colors.text }]}>
                      {trophy.name}
                    </Text>
                  </View>
                  <Text style={[styles.trophyRowCount, { color: theme.colors.text }]}>
                    {trophy.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 3: Tournaments */}
          <View style={[styles.card, { 
            backgroundColor: theme.colors.cardBackground,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Tournaments</Text>
            <View style={styles.tournamentsList}>
              {teamData.tournaments.map((tournament, index) => (
                <View key={index} style={styles.tournamentRow}>
                  {tournament.logo ? (
                    <Image 
                      source={{ uri: tournament.logo }} 
                      style={styles.tournamentLogo} 
                      resizeMode="contain" 
                    />
                  ) : (
                    <View style={[styles.tournamentIconPlaceholder, { backgroundColor: theme.colors.border }]}>
                      <MaterialCommunityIcons 
                        name="soccer" 
                        size={20} 
                        color={theme.colors.textSecondary} 
                      />
                    </View>
                  )}
                  <Text style={[styles.tournamentName, { color: theme.colors.text }]}>
                    {tournament.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : activeTab === 'STANDINGS' ? (
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.standingsContainer}
        >
          {/* League Dropdown */}
          <View style={styles.leagueFilterContainer}>
            <TouchableOpacity
              style={[
                styles.leagueDropdownHeader,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  },
                  android: {
                    elevation: 2,
                  },
                }),
              ]}
              onPress={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
            >
              <Text style={[styles.leagueDropdownText, { color: theme.colors.text }]}>
                {selectedLeague.name}
              </Text>
              <Ionicons 
                name={isLeagueDropdownOpen ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {isLeagueDropdownOpen && (
              <View style={[
                styles.leagueDropdownList,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              ]}>
                {availableLeagues.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    style={[
                      styles.leagueDropdownItem,
                      {
                        backgroundColor: selectedLeagueId === league.id 
                          ? (isDark ? theme.colors.primary + '20' : theme.colors.primary + '10')
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setSelectedLeagueId(league.id);
                      setIsLeagueDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.leagueDropdownItemText,
                        {
                          color: selectedLeagueId === league.id 
                            ? theme.colors.primary 
                            : theme.colors.text,
                          fontFamily: selectedLeagueId === league.id 
                            ? 'Montserrat_700Bold' 
                            : 'Montserrat_500Medium',
                        },
                      ]}
                    >
                      {league.name}
                    </Text>
                    {selectedLeagueId === league.id && (
                      <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* All | Home | Away Filter */}
          <View style={styles.filterTypeContainer}>
            {(['ALL', 'HOME', 'AWAY'] as const).map((type) => {
              const isActive = filterType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterTypeButton,
                    {
                      backgroundColor: isActive 
                        ? theme.colors.primary 
                        : 'transparent',
                      borderColor: theme.colors.primary,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text
                    style={[
                      styles.filterTypeText,
                      {
                        color: isActive 
                          ? '#FFFFFF' 
                          : theme.colors.primary,
                        fontFamily: isActive 
                          ? 'Montserrat_700Bold' 
                          : 'Montserrat_600SemiBold',
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Standings Table */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading standings...
              </Text>
            </View>
          ) : Array.isArray(currentStandings) && currentStandings.length > 0 ? (
            <View style={[styles.standingsCard, { 
              backgroundColor: theme.colors.cardBackground,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
              }),
            }]}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: theme.colors.separator }]}>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>#</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 1 }]}>Team</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>P</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>W</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>D</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>L</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>GD</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>Pts</Text>
              </View>

              {/* Table Rows */}
              {Array.isArray(currentStandings) ? currentStandings.map((row) => {
                if (!row || typeof row !== 'object') return null;
                return (
                <View
                  key={row.rank}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: row.isCurrent 
                        ? (isDark ? theme.colors.primary + '20' : theme.colors.primary + '10')
                        : 'transparent',
                      borderBottomColor: theme.colors.separator,
                    },
                  ]}
                >
                  <Text style={[
                    styles.tableCell,
                    styles.tableCellRank,
                    { 
                      color: row.isCurrent ? theme.colors.primary : theme.colors.text,
                      fontFamily: row.isCurrent ? 'Montserrat_700Bold' : 'Montserrat_600SemiBold',
                    },
                  ]}>
                    {row.rank}
                  </Text>
                  
                  <View style={[styles.tableCellTeam, { flex: 1 }]}>
                    {row.teamLogo ? (
                      <Image 
                        source={{ uri: row.teamLogo }} 
                        style={styles.teamLogoSmall} 
                        resizeMode="contain" 
                      />
                    ) : (
                      <View style={[styles.teamLogoPlaceholder, { backgroundColor: theme.colors.border }]} />
                    )}
                    <Text 
                      style={[
                        styles.tableCellTeamName,
                        { 
                          color: row.isCurrent ? theme.colors.primary : theme.colors.text,
                          fontFamily: row.isCurrent ? 'Montserrat_700Bold' : 'Montserrat_600SemiBold',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {row.team}
                    </Text>
                  </View>
                  
                  <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.mp}</Text>
                  <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.w}</Text>
                  <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.d}</Text>
                  <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.l}</Text>
                  <Text style={[
                    styles.tableCell,
                    { 
                      color: row.gd >= 0 ? theme.colors.primary : '#ef4444',
                      fontFamily: 'Montserrat_600SemiBold',
                    },
                  ]}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </Text>
                  <Text style={[
                    styles.tableCell,
                    styles.tableCellPoints,
                    { 
                      color: row.isCurrent ? theme.colors.primary : theme.colors.text,
                      fontFamily: 'Montserrat_700Bold',
                    },
                  ]}>
                    {row.pts}
                  </Text>
                </View>
                );
              }) : null}
            </View>
          ) : (
            <View style={styles.emptyStandingsContainer}>
              <Text style={[styles.emptyStandingsText, { color: theme.colors.textSecondary }]}>
                No standings data available
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={[styles.comingSoonContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>Coming Soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  headerStarButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  headerLogoContainer: {
    width: 48,
    height: 48,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  headerLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoPlaceholderText: {
    fontSize: 20,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerTeamName: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
  },
  headerCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCountryFlag: {
    fontSize: 16,
  },
  headerCountryName: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
  // Tab Bar
  tabBar: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 15,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 20,
  },
  // Info List (Horizontal Rows)
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  coachImage: {
    width: '100%',
    height: '100%',
  },
  infoFlagIcon: {
    fontSize: 28,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  // Trophy Filter Tabs
  trophyFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  trophyFilterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trophyFilterTabActive: {
    borderRadius: 20,
  },
  trophyFilterText: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
  },
  // Trophy List
  trophyList: {
    gap: 16,
  },
  trophyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  trophyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trophyRowName: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    flex: 1,
  },
  trophyRowCount: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  // Tournaments
  tournamentsList: {
    gap: 12,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tournamentLogo: {
    width: 32,
    height: 32,
  },
  tournamentIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
  },
  // Standings Tab Styles
  standingsContainer: {
    padding: 16,
  },
  leagueFilterContainer: {
    marginBottom: 12,
    zIndex: 10,
  },
  leagueDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  leagueDropdownText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  leagueDropdownList: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  leagueDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  leagueDropdownItemText: {
    fontSize: 15,
    flex: 1,
  },
  filterTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTypeText: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  standingsCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
    minWidth: 28,
  },
  tableCellRank: {
    minWidth: 32,
  },
  tableCellTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  teamLogoSmall: {
    width: 24,
    height: 24,
  },
  teamLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  tableCellTeamName: {
    fontSize: 13,
    flex: 1,
  },
  tableCellPoints: {
    minWidth: 36,
  },
  emptyStandingsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStandingsText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
});
