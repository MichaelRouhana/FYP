import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading team data...</Text>
        </View>
      </View>
    );
  }

  if (!teamData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Team Details', headerBackTitle: 'Search' }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Team not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: teamData.name, headerBackTitle: 'Search' }} />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                  borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? '#FFFFFF' : (isDark ? '#9ca3af' : '#6b7280'),
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'DETAILS' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              {teamData.logo ? (
                <Image source={{ uri: teamData.logo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.border }]}>
                  <Text style={[styles.logoPlaceholderText, { color: colors.text }]}>
                    {teamData.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.teamName, { color: colors.text }]}>{teamData.name}</Text>
            {teamData.countryFlag && (
              <Text style={styles.countryFlag}>{teamData.countryFlag}</Text>
            )}
          </View>

          {/* Section 1: Team Info Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Information</Text>
            <View style={styles.infoGrid}>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff', borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Coach</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{teamData.coach}</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff', borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Founded</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{teamData.founded}</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff', borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Country</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{teamData.country}</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff', borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>UEFA Rank</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {teamData.uefaRank ? `#${teamData.uefaRank}` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: Tournaments */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tournaments</Text>
            <View style={styles.tournamentsContainer}>
              {teamData.tournaments.map((tournament, index) => (
                <View
                  key={index}
                  style={[styles.tournamentChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                >
                  <Text style={[styles.tournamentText, { color: colors.primary }]}>{tournament}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 3: Trophies */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trophies</Text>
            <View style={styles.trophiesContainer}>
              {teamData.trophies.map((trophy, index) => (
                <View
                  key={index}
                  style={[styles.trophyCard, { backgroundColor: isDark ? '#1f1f1f' : '#ffffff', borderColor: colors.border }]}
                >
                  <View style={styles.trophyContent}>
                    <Text style={[styles.trophyName, { color: colors.text }]}>{trophy.name}</Text>
                    <View style={[styles.trophyCountBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.trophyCountText}>{trophy.count}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.comingSoonContainer}>
          <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>Coming Soon</Text>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  countryFlag: {
    fontSize: 32,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  tournamentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tournamentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tournamentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trophiesContainer: {
    gap: 12,
  },
  trophyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  trophyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trophyName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  trophyCountBadge: {
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
    fontWeight: 'bold',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
  },
});
