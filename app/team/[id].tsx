import { Stack, useLocalSearchParams } from 'expo-router';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type TabType = 'DETAILS' | 'STANDINGS' | 'SQUAD' | 'STATS';
type TrophyFilter = 'MAJOR' | 'ALL';

interface Trophy {
  name: string;
  count: number;
  isMajor?: boolean;
}

interface TeamData {
  name: string;
  logo: string;
  country: string;
  countryFlag?: string;
  coach: string;
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
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);

  // Mock data for now - replace with API call later
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData: TeamData = {
        name: 'Real Madrid',
        logo: 'https://media.api-sports.io/football/teams/541.png',
        country: 'Spain',
        countryFlag: '🇪🇸',
        coach: 'Carlo Ancelotti',
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
      setLoading(false);
    }, 500);
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
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
        <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Team not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: teamData.name, 
          headerBackTitle: 'Search',
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerStarButton}>
              <Ionicons
                name={isTeamFavorite ? 'star' : 'star-outline'}
                size={24}
                color={isTeamFavorite ? theme.colors.primary : theme.colors.icon}
              />
            </TouchableOpacity>
          ),
        }} 
      />

      {/* Hero Header with Premium Gradient */}
      <LinearGradient
        colors={getGradientColors()}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          {/* Logo with Shadow */}
          <View style={[
            styles.logoWrapper,
            Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: {
                elevation: 5,
              },
            }),
          ]}>
            {teamData.logo ? (
              <Image source={{ uri: teamData.logo }} style={styles.heroLogo} resizeMode="contain" />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                <Text style={[styles.logoPlaceholderText, { color: theme.colors.text }]}>
                  {teamData.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>

          {/* Team Name */}
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{teamData.name}</Text>

          {/* Meta Info: Country Flag • Country */}
          <View style={styles.heroMeta}>
            {teamData.countryFlag && (
              <>
                <Text style={styles.metaFlag}>{teamData.countryFlag}</Text>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
              </>
            )}
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {teamData.country}
            </Text>
          </View>
        </View>
      </LinearGradient>

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
          {/* Section 1: Info Grid Card */}
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
            <View style={styles.infoGrid}>
              {/* Coach */}
              <View style={styles.infoGridItem}>
                <View style={[styles.infoIconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COACH</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.coach}</Text>
              </View>

              {/* Stadium */}
              <View style={styles.infoGridItem}>
                <View style={[styles.infoIconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="stadium" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>STADIUM</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {teamData.stadium || 'N/A'}
                </Text>
              </View>

              {/* Founded */}
              <View style={styles.infoGridItem}>
                <View style={[styles.infoIconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
              </View>

              {/* UEFA Rank */}
              <View style={styles.infoGridItem}>
                <View style={[styles.infoIconWrapper, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialCommunityIcons name="trophy" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>UEFA RANK</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {teamData.uefaRank ? `#${teamData.uefaRank}` : 'N/A'}
                </Text>
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
  },
  // Hero Header
  heroHeader: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoWrapper: {
    marginBottom: 20,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
  heroLogo: {
    width: 100,
    height: 100,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 40,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_800ExtraBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaFlag: {
    fontSize: 18,
  },
  metaSeparator: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  metaText: {
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
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoGridItem: {
    width: '47%',
    alignItems: 'center',
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
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
});
