import { Stack, useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { getTeamDetails, TeamDetailsDTO, getTeamHeader, TeamHeader, getSquad, SquadMemberDTO, fetchTeamStats } from '@/services/teamApi';
import { TeamStats } from '@/types/team';
import { StatsGroup } from '@/components/team/StatsGroup';
import { getStandings } from '@/services/matchApi';
import { mapStandingsToUI } from '@/utils/matchDataMapper';

type TabType = 'DETAILS' | 'STANDINGS' | 'SQUAD' | 'STATS';

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
}

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const selectedLeagueId = 140; // La Liga - fixed, no filtering
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [details, setDetails] = useState<TeamDetailsDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [header, setHeader] = useState<TeamHeader | null>(null);
  const [standingsData, setStandingsData] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [squad, setSquad] = useState<SquadMemberDTO[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch team data
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
        setDetailsLoading(true);

        // Fetch team header, details, and squad from API
        try {
          const [headerData, detailsData, squadData] = await Promise.all([
            getTeamHeader(teamId),
            getTeamDetails(teamId).catch(() => null), // Don't fail if details endpoint fails
            getSquad(teamId).catch(() => []), // Don't fail if squad endpoint fails
          ]);

          setHeader(headerData);
          setDetails(detailsData);
          setSquad(squadData);

          // Update teamData with header information
          const teamDataUpdate: TeamData = {
            name: headerData.name,
            logo: headerData.logo,
            country: headerData.country,
            countryFlag: '🇪🇸', // TODO: Map country to flag emoji based on country name
            coach: headerData.coachName,
            coachImageUrl: headerData.coachImageUrl,
            founded: headerData.foundedYear.toString(),
            stadium: headerData.stadiumName,
            uefaRank: headerData.uefaRanking,
            // TODO: Fetch active tournaments from backend when endpoint is available
            tournaments: [
              { name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
              { name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
              { name: 'Supercopa de España', logo: '' },
              { name: 'Copa del Rey', logo: '' },
              { name: 'FIFA Club World Cup', logo: '' },
            ],
          };
          setTeamData(teamDataUpdate);
        } catch (apiError) {
          console.error('Error fetching team data from API:', apiError);
          // Fallback to mock data if API fails
        const mockData: TeamData = {
          name: 'Real Madrid',
          logo: 'https://media.api-sports.io/football/teams/541.png',
          country: 'Spain',
          countryFlag: '🇪🇸',
          coach: 'Carlo Ancelotti',
          coachImageUrl: 'https://media.api-sports.io/football/coachs/1.png',
          founded: '1902',
          stadium: 'Santiago Bernabéu',
          uefaRank: 1,
          tournaments: [
            { name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
            { name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
            { name: 'Supercopa de España', logo: '' },
            { name: 'Copa del Rey', logo: '' },
            { name: 'FIFA Club World Cup', logo: '' },
          ],
        };
        setTeamData(mockData);
        } finally {
          setDetailsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
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

  // Fetch standings when teamId changes
  useEffect(() => {
    const fetchStandings = async () => {
      if (!selectedLeagueId || !teamId || teamId === 0) return;

      try {
        setStandingsLoading(true);
        const rawStandingsData = await getStandings(selectedLeagueId, 2023);
        
        // Transform using mapStandingsToUI
        const mappedData = mapStandingsToUI(rawStandingsData);
        
        if (mappedData && mappedData.standings) {
          // Map TeamStanding to StandingRow format
          const transformedStandings: StandingRow[] = mappedData.standings.map((standing) => ({
            rank: standing.position,
            team: standing.teamName,
            teamLogo: (standing as any).teamLogo, // mapStandingsToUI includes teamLogo
            mp: standing.played,
            w: standing.won,
            d: standing.drawn,
            l: standing.lost,
            gd: (standing as any).goalDifference || 0, // mapStandingsToUI includes goalDifference
            pts: standing.points,
            isCurrent: false, // Will be set below by comparing team names
          }));

          // Mark current team by comparing team name with teamData
          if (teamData) {
            transformedStandings.forEach((row) => {
              row.isCurrent = row.team.toLowerCase() === teamData.name.toLowerCase();
            });
          }

          setStandingsData(transformedStandings);
        } else {
          setStandingsData([]);
        }
      } catch (error) {
        console.error('Error fetching standings:', error);
        setStandingsData([]);
      } finally {
        setStandingsLoading(false);
      }
    };

    fetchStandings();
  }, [teamId]);

  // Update isCurrent flag when teamData becomes available
  useEffect(() => {
    if (teamData && standingsData.length > 0) {
      setStandingsData((prevStandings) => 
        prevStandings.map((row) => ({
          ...row,
          isCurrent: row.team.toLowerCase() === teamData.name.toLowerCase(),
        }))
      );
    }
  }, [teamData]);

  // Fetch team stats when STATS tab is active
  useEffect(() => {
    const loadTeamStats = async () => {
      if (activeTab === 'STATS' && teamId && !stats && !statsLoading) {
        try {
          setStatsLoading(true);
          // Use 2025 season (current season with data)
          const currentSeason = 2025;
          console.log(`[Team Stats] Fetching for teamId: ${teamId}, leagueId: ${selectedLeagueId}, season: ${currentSeason}`);
          const teamStats = await fetchTeamStats(teamId, selectedLeagueId, currentSeason);
          console.log('[Team Stats] Fetched:', JSON.stringify(teamStats, null, 2));
          setStats(teamStats);
        } catch (error) {
          console.error('Error fetching team stats:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    loadTeamStats();
  }, [activeTab, teamId, stats, statsLoading, selectedLeagueId]);

  const currentStandings = standingsData;

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
          borderBottomColor: theme.colors.separator,
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
            <View style={[styles.headerLogoPlaceholder, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
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
                      : theme.colors.textSecondary,
                    opacity: activeTab === tab ? 1 : 0.6,
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
          {/* Stadium Details Section */}
          {detailsLoading ? (
            <View style={[styles.card, { 
              backgroundColor: theme.colors.cardBackground,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 40,
            }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Loading stadium details...
              </Text>
            </View>
          ) : details ? (
            <>
              {/* Stadium Information Card */}
              <View style={[styles.card, { 
                backgroundColor: theme.colors.cardBackground,
                marginBottom: 16,
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
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Stadium Information</Text>
                <View style={styles.infoList}>
                  {/* Stadium Name */}
                  {details.stadiumName && (
                    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                      <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                        <MaterialCommunityIcons name="stadium" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>STADIUM</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{details.stadiumName}</Text>
                      </View>
                    </View>
                  )}

                  {/* City */}
                  {details.city && (
                    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                      <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                        <Ionicons name="location" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>CITY</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{details.city}</Text>
                      </View>
                    </View>
                  )}

                  {/* Capacity */}
                  {details.capacity && details.capacity > 0 && (
                    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                      <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                        <Ionicons name="people" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>CAPACITY</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                          {details.capacity.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Founded Year */}
                  {details.foundedYear && details.foundedYear > 0 && (
                    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                      <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                        <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{details.foundedYear}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : null}

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
              <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB', overflow: 'hidden' }]}>
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
              <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
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
              <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                  <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
                </View>
              </View>

              {/* UEFA Ranking */}
              <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
                <View style={[styles.infoIconCircle, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
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

          {/* Section 2: Tournaments */}
          {/* TODO: Fetch active tournaments from backend when endpoint is available */}
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
                    <View style={[styles.tournamentIconPlaceholder, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
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
          {/* Standings Table */}
          {standingsLoading ? (
            <View style={[styles.standingsCard, { 
              backgroundColor: theme.colors.cardBackground,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 40,
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
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                Loading standings...
                    </Text>
          </View>
          ) : currentStandings.length > 0 ? (
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
                <Text style={[styles.tableHeaderText, styles.tableCellRank, { color: theme.colors.textSecondary }]}>#</Text>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary, flex: 1, marginRight: 8 }]}>TEAM</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>P</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>W</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>D</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>L</Text>
                <Text style={[styles.tableHeaderText, styles.tableCell, { color: theme.colors.textSecondary }]}>GD</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellPoints, { color: theme.colors.textSecondary }]}>PTS</Text>
              </View>

              {/* Table Rows */}
              {currentStandings.map((row) => (
                <View
                  key={row.rank}
                  style={[
                    styles.tableRow,
                    row.isCurrent && styles.tableRowHighlighted,
                    {
                      borderBottomColor: theme.colors.separator,
                      backgroundColor: row.isCurrent ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={[
                    styles.tableCell,
                    styles.tableCellRank,
                    { 
                        color: row.isCurrent ? theme.colors.primaryText : theme.colors.text,
                      fontFamily: row.isCurrent ? 'Montserrat_700Bold' : 'Montserrat_600SemiBold',
                    },
                  ]}>
                    {row.rank}
                  </Text>
                  
                    <View 
                      style={[
                        styles.tableCellTeam, 
                        { 
                          flex: 1,
                        }
                      ]}
                    >
                    {row.teamLogo ? (
                      <Image 
                        source={{ uri: row.teamLogo }} 
                        style={styles.teamLogoSmall} 
                        resizeMode="contain" 
                      />
                    ) : (
                      <View style={[styles.teamLogoPlaceholder, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]} />
                    )}
                    <Text 
                      style={[
                        styles.tableCellTeamName,
                        { 
                            color: row.isCurrent ? theme.colors.primaryText : theme.colors.text,
                          fontFamily: row.isCurrent ? 'Montserrat_700Bold' : 'Montserrat_600SemiBold',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {row.team}
                    </Text>
                  </View>
                  
                    <Text style={[
                      styles.tableCell, 
                      { color: row.isCurrent ? theme.colors.primaryText : theme.colors.text }
                    ]}>
                      {row.mp}
                    </Text>
                    <Text style={[
                      styles.tableCell, 
                      { color: row.isCurrent ? theme.colors.primaryText : theme.colors.text }
                    ]}>
                      {row.w}
                    </Text>
                    <Text style={[
                      styles.tableCell, 
                      { color: row.isCurrent ? theme.colors.primaryText : theme.colors.text }
                    ]}>
                      {row.d}
                    </Text>
                    <Text style={[
                      styles.tableCell, 
                      { color: row.isCurrent ? theme.colors.primaryText : theme.colors.text }
                    ]}>
                      {row.l}
                    </Text>
                  <Text style={[
                    styles.tableCell,
                    { 
                        color: row.isCurrent 
                          ? theme.colors.primaryText
                          : (row.gd >= 0 ? theme.colors.primary : (isDark ? '#ef4444' : '#dc2626')),
                      fontFamily: 'Montserrat_600SemiBold',
                    },
                  ]}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </Text>
                  <Text style={[
                    styles.tableCell,
                    styles.tableCellPoints,
                    { 
                        color: row.isCurrent ? theme.colors.primaryText : theme.colors.text,
                      fontFamily: 'Montserrat_700Bold',
                    },
                  ]}>
                    {row.pts}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStandingsContainer}>
              <Text style={[styles.emptyStandingsText, { color: theme.colors.textSecondary }]}>
                No standings data available
              </Text>
            </View>
          )}
        </ScrollView>
      ) : activeTab === 'SQUAD' ? (
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.squadContainer}
        >
          {(() => {
            // Group players by position
            const positionGroups: Record<string, SquadMemberDTO[]> = {
              'GK': [],
              'DEF': [],
              'MID': [],
              'FWD': [],
            };
            
            squad.forEach((player) => {
              const position = player.position?.toUpperCase() || '';
              if (position === 'GK') {
                positionGroups['GK'].push(player);
              } else if (position === 'DEF') {
                positionGroups['DEF'].push(player);
              } else if (position === 'MID') {
                positionGroups['MID'].push(player);
              } else if (position === 'FWD') {
                positionGroups['FWD'].push(player);
              }
            });

            const positionLabels: Record<string, string> = {
              'GK': 'GOALKEEPERS',
              'DEF': 'DEFENDERS',
              'MID': 'MIDFIELDERS',
              'FWD': 'FORWARDS',
            };

            return (
              <>
                {/* Coach Section */}
                {teamData?.coach && (
                  <View style={styles.squadSection}>
                    <View style={[
                      styles.squadCard,
                      { 
                        backgroundColor: theme.colors.cardBackground,
                        borderRadius: 24,
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
                      }
                    ]}>
                      <View style={[styles.playerCard, {
                        borderBottomWidth: 0,
                        backgroundColor: 'transparent',
                      }]}>
                        <View style={[styles.playerPhotoContainer, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                          {teamData.coachImageUrl ? (
                            <Image 
                              source={{ uri: teamData.coachImageUrl }} 
                              style={styles.playerPhoto}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.playerPhotoPlaceholder, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                              <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                            </View>
                          )}
                        </View>
                        <View style={styles.playerInfoContainer}>
                          <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
                            {teamData.coach}
                          </Text>
                          <Text style={[styles.playerPosition, { color: theme.colors.textSecondary }]}>
                            Coach
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Player Position Groups - Ordered: FWD, MID, DEF, GK */}
                {(['FWD', 'MID', 'DEF', 'GK'] as const).map((positionKey) => {
                  const players = positionGroups[positionKey];
                  if (players.length === 0) return null;

                  return (
                    <View key={positionKey} style={styles.squadSection}>
                      <Text style={[styles.squadSectionTitle, { color: theme.colors.text }]}>
                        {positionLabels[positionKey]}
                      </Text>
                      <View style={[
                        styles.squadCard,
                        { 
                          backgroundColor: theme.colors.cardBackground,
                          borderRadius: 24,
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
                        }
                      ]}>
                        {players.map((player, index) => {
                          // Map position code to readable text
                          const positionText: Record<string, string> = {
                            'GK': 'Goalkeeper',
                            'DEF': 'Defender',
                            'MID': 'Midfielder',
                            'FWD': 'Attacker',
                          };
                          const readablePosition = positionText[player.position?.toUpperCase() || ''] || player.position || '';
                          const isPlayerFavorite = isFavorite('player', player.id);
                          const isLastPlayer = index === players.length - 1;

                          const handleToggleFavorite = (e: any) => {
                            e.stopPropagation();
                            toggleFavorite('player', {
                              id: player.id,
                              name: player.name,
                              imageUrl: player.photoUrl || '',
                              type: 'player',
                            });
                          };

                          return (
                            <TouchableOpacity
                              key={player.id}
                              style={[styles.playerCard, {
                                borderBottomColor: theme.colors.separator,
                                borderBottomWidth: isLastPlayer ? 0 : 1,
                                backgroundColor: 'transparent',
                              }]}
                              onPress={() => router.push(`/player/${player.id}`)}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.playerPhotoContainer, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                                {player.photoUrl ? (
                                  <Image 
                                    source={{ uri: player.photoUrl }} 
                                    style={styles.playerPhoto}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={[styles.playerPhotoPlaceholder, { backgroundColor: isDark ? theme.colors.border : '#E5E7EB' }]}>
                                    <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                                  </View>
                                )}
                              </View>
                              <View style={styles.playerInfoContainer}>
                                <View style={styles.playerNameRow}>
                                  <Text style={[styles.playerName, { color: theme.colors.text }]} numberOfLines={1}>
                                    {player.name}
                                  </Text>
                                  {player.nationalityFlag && (
                                    <Text style={styles.playerFlag}>{player.nationalityFlag}</Text>
                                  )}
                                </View>
                                <View style={styles.playerDetailsRow}>
                                  <Text style={[styles.playerPosition, { color: theme.colors.textSecondary }]}>
                                    {readablePosition}
                                  </Text>
                                  {player.nationality && !player.nationalityFlag && (
                                    <Text style={[styles.playerNationality, { color: theme.colors.textSecondary }]}>
                                      {player.nationality}
                                    </Text>
                                  )}
                                </View>
                                {player.injured && (
                                  <Text style={[styles.playerInjury, { color: theme.colors.primary }]}>
                                    🚑 {player.injuryReason || 'Injured'}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.playerRightSection}>
                                {player.number !== undefined && player.number !== null && (
                                  <Text style={[styles.playerNumber, { color: theme.colors.primary }]}>
                                    {player.number}
                                  </Text>
                                )}
                                <TouchableOpacity 
                                  onPress={handleToggleFavorite}
                                  style={styles.favoriteButton}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <Ionicons
                                    name={isPlayerFavorite ? 'star' : 'star-outline'}
                                    size={20}
                                    color={isPlayerFavorite ? theme.colors.primary : theme.colors.iconMuted}
                                  />
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </>
            );
          })()}
        </ScrollView>
      ) : activeTab === 'STATS' ? (
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          {statsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading stats...</Text>
            </View>
          ) : stats ? (
            <>
              {/* Summary Group */}
              <StatsGroup title="Summary" data={stats.summary} theme={theme} />

              {/* Attacking Group */}
              <StatsGroup title="Attacking" data={stats.attacking} theme={theme} />

              {/* Defending Group */}
              <StatsGroup title="Defending" data={stats.defending} theme={theme} />

              {/* Other Group */}
              <StatsGroup title="Other" data={stats.other} theme={theme} />
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>No stats available</Text>
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
  // Squad Tab Styles
  squadContainer: {
    padding: 16,
    gap: 24,
  },
  statsContainer: {
    padding: 16,
    gap: 16,
  },
  squadSection: {
    borderRadius: 8,

  },
  squadSectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
    marginLeft: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  squadCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  playerPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPhoto: {
    width: '100%',
    height: '100%',
  },
  playerPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  playerFlag: {
    fontSize: 16,
  },
  playerDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerPosition: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
  },
  playerNationality: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  playerInjury: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 2,
  },
  playerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerNumber: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    minWidth: 28,
    textAlign: 'right',
  },
  favoriteButton: {
    padding: 4,
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
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  leagueFilterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  leagueChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  leagueChipText: {
    fontSize: 14,
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
  tableRowHighlighted: {
    marginHorizontal: -16,
    paddingHorizontal: 24,
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
    backgroundColor: 'transparent',
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
