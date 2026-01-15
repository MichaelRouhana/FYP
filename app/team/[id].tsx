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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type TabType = 'DETAILS' | 'STANDINGS' | 'SQUAD' | 'STATS';

interface Trophy {
  name: string;
  count: number;
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
  tournaments: string[];
  trophies: Trophy[];
}

export default function TeamDetails() {
  const { id } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
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
        tournaments: ['La Liga', 'Champions League', 'Copa del Rey'],
        trophies: [
          { name: 'UEFA Champions League', count: 14 },
          { name: 'La Liga', count: 35 },
          { name: 'Copa del Rey', count: 20 },
          { name: 'FIFA Club World Cup', count: 5 },
        ],
      };
      setTeamData(mockData);
      setLoading(false);
    }, 500);
  }, [id]);

  const tabs: TabType[] = ['DETAILS', 'STANDINGS', 'SQUAD', 'STATS'];

  // Get gradient colors based on theme
  const getGradientColors = () => {
    if (isDark) {
      return ['#1a1f2e', '#111828', '#080C17'];
    }
    return ['#f8fafc', '#ffffff', '#f3f4f6'];
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
      <Stack.Screen options={{ title: teamData.name, headerBackTitle: 'Search' }} />

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

          {/* Meta Info: Country Flag • Founded Year */}
          <View style={styles.heroMeta}>
            {teamData.countryFlag && (
              <>
                <Text style={styles.metaFlag}>{teamData.countryFlag}</Text>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
              </>
            )}
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              Founded {teamData.founded}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Custom Segmented Control Tabs */}
      <View style={[styles.tabBar, { backgroundColor: 'transparent' }]}>
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
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>COACH</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.coach}</Text>
              </View>

              {/* Stadium */}
              <View style={styles.infoGridItem}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="stadium" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>STADIUM</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {teamData.stadium || 'N/A'}
                </Text>
              </View>

              {/* Founded */}
              <View style={styles.infoGridItem}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>FOUNDED</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
              </View>

              {/* UEFA Rank */}
              <View style={styles.infoGridItem}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="trophy" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>UEFA RANK</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {teamData.uefaRank ? `#${teamData.uefaRank}` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: Trophy Cabinet */}
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
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Trophy Cabinet</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.trophyCabinet}
            >
              {teamData.trophies.map((trophy, index) => (
                <View key={index} style={styles.trophyItem}>
                  {/* Circular Trophy Icon */}
                  <View style={[
                    styles.trophyIconCircle,
                    { 
                      backgroundColor: index === 0 
                        ? '#FFD700' // Gold for first trophy
                        : index === 1 
                        ? '#C0C0C0' // Silver for second
                        : '#CD7F32', // Bronze for others
                      opacity: isDark ? 0.9 : 0.8,
                    }
                  ]}>
                    <MaterialCommunityIcons 
                      name="trophy" 
                      size={32} 
                      color={isDark ? '#000' : '#fff'} 
                    />
                  </View>
                  
                  {/* Count Badge */}
                  <View style={[styles.trophyCountBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.trophyCountText}>{trophy.count}</Text>
                  </View>
                  
                  {/* Trophy Name */}
                  <Text style={[styles.trophyName, { color: theme.colors.text }]} numberOfLines={2}>
                    {trophy.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section 3: Active Leagues */}
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
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Active Leagues</Text>
            <View style={styles.leaguesContainer}>
              {teamData.tournaments.map((tournament, index) => (
                <View
                  key={index}
                  style={[styles.leaguePill, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.primary,
                    borderWidth: 1.5,
                  }]}
                >
                  <Text style={[styles.leaguePillText, { color: theme.colors.primary }]}>
                    {tournament}
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
    fontSize: 28,
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
    fontSize: 20,
  },
  metaSeparator: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
  // Tab Bar
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
  // Trophy Cabinet
  trophyCabinet: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 16,
  },
  trophyItem: {
    width: 120,
    alignItems: 'center',
  },
  trophyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  trophyCountBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  trophyName: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    marginTop: 8,
  },
  // Active Leagues
  leaguesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  leaguePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  leaguePillText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
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
