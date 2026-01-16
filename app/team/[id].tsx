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
import { getTeamDetails, TeamDetailsDTO } from '@/services/teamApi';

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
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [details, setDetails] = useState<TeamDetailsDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

        // Mock data for team header (replace with API call when available)
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
          trophies: [
            { name: 'LaLiga', count: 36, isMajor: true },
            { name: 'Copa del Rey', count: 20, isMajor: true },
            { name: 'UEFA Champions League', count: 15, isMajor: true },
            { name: 'FIFA Club World Cup', count: 5, isMajor: true },
            { name: 'UEFA Europa League', count: 2, isMajor: false },
            { name: 'UEFA Super Cup', count: 6, isMajor: false },
            { name: 'Intercontinental Cup', count: 3, isMajor: false },
          ],
        };
        setTeamData(mockData);

        // Fetch team details from API
        try {
          const teamDetails = await getTeamDetails(teamId);
          setDetails(teamDetails);
        } catch (detailsError) {
          console.error('Error fetching team details:', detailsError);
          // Don't fail the whole page if details fail
          setDetails(null);
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

  // Filter trophies based on selected filter
  const filteredTrophies = teamData?.trophies.filter(trophy => 
    trophyFilter === 'MAJOR' ? trophy.isMajor : true
  ) || [];

  // Mock leagues for filter
  const availableLeagues = [
    { id: 'la_liga', name: 'La Liga' },
    { id: 'ucl', name: 'Champions League' },
    { id: 'copa', name: 'Copa del Rey' },
  ];

  // Mock standings data
  const mockStandings: Record<string, StandingRow[]> = {
    la_liga: [
      { rank: 1, team: 'Real Madrid', teamLogo: 'https://media.api-sports.io/football/teams/541.png', mp: 20, w: 16, d: 3, l: 1, gd: 35, pts: 51, isCurrent: true },
      { rank: 2, team: 'Girona', teamLogo: 'https://media.api-sports.io/football/teams/533.png', mp: 20, w: 15, d: 4, l: 1, gd: 28, pts: 49, isCurrent: false },
      { rank: 3, team: 'Barcelona', teamLogo: 'https://media.api-sports.io/football/teams/529.png', mp: 20, w: 13, d: 5, l: 2, gd: 24, pts: 44, isCurrent: false },
      { rank: 4, team: 'Atletico Madrid', teamLogo: 'https://media.api-sports.io/football/teams/530.png', mp: 20, w: 12, d: 6, l: 2, gd: 18, pts: 42, isCurrent: false },
      { rank: 5, team: 'Athletic Bilbao', teamLogo: 'https://media.api-sports.io/football/teams/531.png', mp: 20, w: 11, d: 5, l: 4, gd: 15, pts: 38, isCurrent: false },
      { rank: 6, team: 'Real Sociedad', teamLogo: 'https://media.api-sports.io/football/teams/548.png', mp: 20, w: 10, d: 6, l: 4, gd: 12, pts: 36, isCurrent: false },
      { rank: 7, team: 'Valencia', teamLogo: 'https://media.api-sports.io/football/teams/532.png', mp: 20, w: 9, d: 7, l: 4, gd: 8, pts: 34, isCurrent: false },
      { rank: 8, team: 'Villarreal', teamLogo: 'https://media.api-sports.io/football/teams/533.png', mp: 20, w: 9, d: 6, l: 5, gd: 5, pts: 33, isCurrent: false },
    ],
    ucl: [
      { rank: 1, team: 'Real Madrid', teamLogo: 'https://media.api-sports.io/football/teams/541.png', mp: 6, w: 6, d: 0, l: 0, gd: 12, pts: 18, isCurrent: true },
      { rank: 2, team: 'Manchester City', teamLogo: 'https://media.api-sports.io/football/teams/50.png', mp: 6, w: 5, d: 1, l: 0, gd: 10, pts: 16, isCurrent: false },
      { rank: 3, team: 'Bayern Munich', teamLogo: 'https://media.api-sports.io/football/teams/157.png', mp: 6, w: 5, d: 0, l: 1, gd: 8, pts: 15, isCurrent: false },
      { rank: 4, team: 'PSG', teamLogo: 'https://media.api-sports.io/football/teams/85.png', mp: 6, w: 4, d: 1, l: 1, gd: 6, pts: 13, isCurrent: false },
    ],
    copa: [
      { rank: 1, team: 'Real Madrid', teamLogo: 'https://media.api-sports.io/football/teams/541.png', mp: 4, w: 4, d: 0, l: 0, gd: 8, pts: 12, isCurrent: true },
      { rank: 2, team: 'Barcelona', teamLogo: 'https://media.api-sports.io/football/teams/529.png', mp: 4, w: 3, d: 0, l: 1, gd: 5, pts: 9, isCurrent: false },
    ],
  };

  const currentStandings = mockStandings[selectedLeagueId] || [];

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
              {/* Stadium Image */}
              {details.stadiumImage && (
                <View style={[styles.card, { 
                  backgroundColor: theme.colors.cardBackground,
                  padding: 0,
                  overflow: 'hidden',
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
                  <Image 
                    source={{ uri: details.stadiumImage }} 
                    style={styles.stadiumImage}
                    resizeMode="cover"
                  />
                </View>
              )}

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
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
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
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
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
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
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
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.border }]}>
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
          {/* League Filter */}
          <View style={styles.leagueFilterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.leagueFilterScroll}
            >
              {availableLeagues.map((league) => {
                const isSelected = selectedLeagueId === league.id;
                return (
                  <TouchableOpacity
                    key={league.id}
                    style={[
                      styles.leagueChip,
                      {
                        backgroundColor: isSelected 
                          ? theme.colors.primary 
                          : 'transparent',
                        borderColor: theme.colors.primary,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => setSelectedLeagueId(league.id)}
                  >
                    <Text
                      style={[
                        styles.leagueChipText,
                        {
                          color: isSelected 
                            ? '#FFFFFF' 
                            : theme.colors.primary,
                          fontFamily: isSelected 
                            ? 'Montserrat_700Bold' 
                            : 'Montserrat_600SemiBold',
                        },
                      ]}
                    >
                      {league.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Standings Table */}
          {currentStandings.length > 0 ? (
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
              {currentStandings.map((row) => (
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
  stadiumImage: {
    width: '100%',
    height: 200,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
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
    marginBottom: 16,
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
