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
        <Stack.Screen options={{ title: 'Team Details', headerShown: false }} />
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
        <Stack.Screen options={{ title: 'Team Details', headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Team not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#000000', '#1a1a1a'] : ['#1a1a1a', '#2d2d2d']}
        style={styles.heroHeader}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Center Content */}
        <View style={styles.heroContent}>
          {/* Logo with White Border/Shadow */}
          <View style={[
            styles.logoWrapper,
            {
              borderWidth: 3,
              borderColor: '#FFFFFF',
              ...Platform.select({
                ios: {
                  shadowColor: '#FFFFFF',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                },
                android: {
                  elevation: 8,
                },
              }),
            },
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
          <Text style={styles.heroTitle}>{teamData.name}</Text>

          {/* Star/Follow Button */}
          <TouchableOpacity 
            style={styles.followButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isTeamFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isTeamFavorite ? '#FFD700' : '#FFFFFF'}
            />
          </TouchableOpacity>
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
          {/* Section 1: Active Competitions (Tournaments) */}
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
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Active Competitions</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.tournamentsContainer}
            >
              {teamData.tournaments.map((tournament, index) => (
                <View
                  key={index}
                  style={[styles.tournamentPill, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.primary,
                    borderWidth: 1.5,
                  }]}
                >
                  <Text style={[styles.tournamentPillText, { color: theme.colors.primary }]}>
                    {tournament.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section 2: Cabinet (Trophies) */}
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
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Cabinet</Text>
            
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

            {/* Trophy Cards - Horizontal ScrollView */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.trophyCabinet}
            >
              {filteredTrophies.map((trophy, index) => (
                <View key={index} style={styles.trophyCard}>
                  <View style={[styles.trophyCardIcon, { backgroundColor: '#FFD700' + '30' }]}>
                    <MaterialCommunityIcons 
                      name="trophy" 
                      size={40} 
                      color="#FFD700" 
                    />
                  </View>
                  <View style={[styles.trophyCountBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.trophyCountText}>{trophy.count}</Text>
                  </View>
                  <Text style={[styles.trophyCardName, { color: theme.colors.text }]} numberOfLines={2}>
                    {trophy.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section 3: Club Information (Team Info Grid) - AT THE BOTTOM */}
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
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Club Information</Text>
            <View style={styles.infoGrid}>
              {/* Coach */}
              <View style={[styles.infoGridItem, styles.infoGridItemWithBorder]}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COACH</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.coach}</Text>
              </View>

              {/* Stadium */}
              <View style={[styles.infoGridItem, styles.infoGridItemWithBorder]}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>STADIUM</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {teamData.stadium || 'N/A'}
                </Text>
              </View>

              {/* Founded */}
              <View style={[styles.infoGridItem, styles.infoGridItemWithBorder]}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
              </View>

              {/* Country */}
              <View style={[styles.infoGridItem, styles.infoGridItemWithBorder]}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COUNTRY</Text>
                <View style={styles.countryRow}>
                  {teamData.countryFlag && <Text style={styles.countryFlag}>{teamData.countryFlag}</Text>}
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.country}</Text>
                </View>
              </View>
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
  // Hero Header
  heroHeader: {
    height: 200,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
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
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  followButton: {
    padding: 8,
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
    marginBottom: 16,
  },
  // Tournaments (Active Competitions)
  tournamentsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  tournamentPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tournamentPillText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  // Trophy Filter Tabs
  trophyFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  // Trophy Cabinet
  trophyCabinet: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  trophyCard: {
    width: 80,
    alignItems: 'center',
    position: 'relative',
  },
  trophyCardIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trophyCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  trophyCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  trophyCardName: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    marginTop: 4,
  },
  // Info Grid (Club Information)
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoGridItem: {
    width: '50%',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  infoGridItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
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
