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

      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#111828', '#080C17'] : ['#FFFFFF', '#F3F4F6']}
        style={styles.headerGradient}
      >
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            {teamData.logo ? (
              <Image source={{ uri: teamData.logo }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                <Text style={[styles.logoPlaceholderText, { color: theme.colors.text }]}>
                  {teamData.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>{teamData.name}</Text>
          {teamData.countryFlag && (
            <Text style={styles.countryFlag}>{teamData.countryFlag}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { 
        borderBottomColor: theme.colors.separator, 
        backgroundColor: isDark ? 'transparent' : theme.colors.headerBackground 
      }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.colors.textSecondary },
                  activeTab === tab && [styles.tabTextSelected, { color: theme.colors.text }],
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
          {/* Section 1: Team Info Grid */}
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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Team Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Coach</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.coach}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Founded</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.founded}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Country</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{teamData.country}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>UEFA Rank</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {teamData.uefaRank ? `#${teamData.uefaRank}` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: Tournaments */}
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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tournaments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tournamentsContainer}>
              {teamData.tournaments.map((tournament, index) => (
                <View
                  key={index}
                  style={[styles.tournamentChip, { 
                    backgroundColor: theme.colors.primary + '20', 
                    borderColor: theme.colors.primary 
                  }]}
                >
                  <Text style={[styles.tournamentText, { color: theme.colors.primary }]}>
                    {tournament}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section 3: Trophies */}
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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trophies</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trophiesContainer}>
              {teamData.trophies.map((trophy, index) => (
                <View
                  key={index}
                  style={[styles.trophyCard, { 
                    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
                    borderColor: theme.colors.border,
                    ...Platform.select({
                      ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                      },
                      android: {
                        elevation: 2,
                      },
                    }),
                  }]}
                >
                  <View style={styles.trophyContent}>
                    <Text style={[styles.trophyName, { color: theme.colors.text }]} numberOfLines={2}>
                      {trophy.name}
                    </Text>
                    <View style={[styles.trophyCountBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.trophyCountText}>{trophy.count}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  logo: {
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
  teamName: {
    fontSize: 28,
    fontFamily: 'Montserrat_800ExtraBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  countryFlag: {
    fontSize: 32,
  },
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
  },
  tabTextSelected: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
  },
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '47%',
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
    fontFamily: 'Montserrat_600SemiBold',
  },
  tournamentsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  tournamentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tournamentText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  trophiesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  trophyCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  trophyContent: {
    gap: 12,
  },
  trophyName: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    minHeight: 40,
  },
  trophyCountBadge: {
    alignSelf: 'flex-start',
    minWidth: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  trophyCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
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
