import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { getBetById, getAllMockBets } from '@/services/betApi';

// Helper to map market type to display name
const getMarketDisplayName = (marketType: string): string => {
  const marketMap: Record<string, string> = {
    'MATCH_WINNER': 'Match Winner',
    'GOALS_OVER_UNDER': 'Goals Over/Under',
    'BOTH_TEAMS_TO_SCORE': 'Both Teams To Score',
    'FIRST_TEAM_TO_SCORE': 'First Team To Score',
    'DOUBLE_CHANCE': 'Double Chance',
    'SCORE_PREDICTION': 'Score Prediction',
    'MULTI_LEG': 'Multi-Leg Bet',
  };
  return marketMap[marketType] || marketType;
};

// Helper to format selection name
const formatSelectionName = (marketType: string, selection: string): string => {
  if (marketType === 'MATCH_WINNER') {
    if (selection === 'HOME') return 'Home to Win';
    if (selection === 'DRAW') return 'Draw';
    if (selection === 'AWAY') return 'Away to Win';
  }
  if (marketType === 'GOALS_OVER_UNDER') {
    return selection; // Already formatted as "Over 2.5" or "Under 2.5"
  }
  if (marketType === 'BOTH_TEAMS_TO_SCORE') {
    return selection === 'Yes' ? 'Both Teams to Score - Yes' : 'Both Teams to Score - No';
  }
  if (marketType === 'FIRST_TEAM_TO_SCORE') {
    return selection === 'HOME' ? 'Home to Score First' : 'Away to Score First';
  }
  if (marketType === 'DOUBLE_CHANCE') {
    if (selection === 'X1') return 'Home or Draw (1X)';
    if (selection === '12') return 'Home or Away (12)';
    if (selection === 'X2') return 'Away or Draw (X2)';
  }
  if (marketType === 'SCORE_PREDICTION') {
    return `Exact Score: ${selection}`;
  }
  return selection;
};

// Mock Bet Slip Data Generator (fallback)
const generateMockBetSlip = (betId: string): any | null => {
  // Mock data based on bet ID
  const mockSlips: Record<string, BetSlip> = {
    '1': {
      id: '1',
      matchId: '123',
      homeTeam: 'Roma',
      awayTeam: 'Genoa',
      homeTeamLogo: 'https://media.api-sports.io/football/teams/99.png',
      awayTeamLogo: 'https://media.api-sports.io/football/teams/107.png',
      homeScore: 2,
      awayScore: 1,
      matchTime: '02:00 PM',
      matchDate: '2025-11-22',
      wagerAmount: 100,
      status: 'Won',
      legs: [
        {
          id: 'leg-1',
          selectionName: 'Roma to Win',
          marketName: 'Match Winner',
          odds: 1.5,
          status: 'Won',
        },
        {
          id: 'leg-2',
          selectionName: 'Over 2.5 Goals',
          marketName: 'Goals Over/Under',
          odds: 1.8,
          status: 'Won',
        },
        {
          id: 'leg-3',
          selectionName: 'Both Teams to Score - Yes',
          marketName: 'Both Teams To Score',
          odds: 1.6,
          status: 'Won',
        },
      ],
    },
    '2': {
      id: '2',
      matchId: '124',
      homeTeam: 'PSG',
      awayTeam: 'Lorient',
      homeTeamLogo: 'https://media.api-sports.io/football/teams/85.png',
      awayTeamLogo: 'https://media.api-sports.io/football/teams/99.png',
      homeScore: 1,
      awayScore: 0,
      matchTime: '02:00 PM',
      matchDate: '2025-11-22',
      wagerAmount: 50,
      status: 'Pending',
      legs: [
        {
          id: 'leg-1',
          selectionName: 'PSG to Win',
          marketName: 'Match Winner',
          odds: 1.2,
          status: 'Pending',
        },
        {
          id: 'leg-2',
          selectionName: 'Under 2.5 Goals',
          marketName: 'Goals Over/Under',
          odds: 2.1,
          status: 'Pending',
        },
      ],
    },
    '3': {
      id: '3',
      matchId: '125',
      homeTeam: 'PSG',
      awayTeam: 'Lorient',
      homeTeamLogo: 'https://media.api-sports.io/football/teams/85.png',
      awayTeamLogo: 'https://media.api-sports.io/football/teams/99.png',
      homeScore: 0,
      awayScore: 2,
      matchTime: '02:00 PM',
      matchDate: '2025-11-22',
      wagerAmount: 100,
      status: 'Lost',
      legs: [
        {
          id: 'leg-1',
          selectionName: 'PSG to Win',
          marketName: 'Match Winner',
          odds: 1.2,
          status: 'Lost',
        },
        {
          id: 'leg-2',
          selectionName: 'Over 2.5 Goals',
          marketName: 'Goals Over/Under',
          odds: 1.8,
          status: 'Won',
        },
      ],
    },
  };

  // Return specific mock if exists, otherwise generate a default one
  if (mockSlips[betId]) {
    return mockSlips[betId];
  }

  // Generate a default bet slip for any other ID
  const statuses: ('Pending' | 'Won' | 'Lost')[] = ['Pending', 'Won', 'Lost'];
  const randomStatus = statuses[parseInt(betId) % 3] || 'Pending';
  
  return {
    id: betId,
    matchId: `match-${betId}`,
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    homeTeamLogo: 'https://media.api-sports.io/football/teams/85.png',
    awayTeamLogo: 'https://media.api-sports.io/football/teams/99.png',
    homeScore: randomStatus === 'Won' ? 2 : randomStatus === 'Lost' ? 0 : undefined,
    awayScore: randomStatus === 'Won' ? 1 : randomStatus === 'Lost' ? 2 : undefined,
    matchTime: '02:00 PM',
    matchDate: '2025-11-22',
    wagerAmount: 100,
    status: randomStatus,
    legs: [
      {
        id: 'leg-1',
        selectionName: 'Team A to Win',
        marketName: 'Match Winner',
        odds: 1.5,
        status: randomStatus === 'Pending' ? 'Pending' : randomStatus === 'Won' ? 'Won' : 'Lost',
      },
      {
        id: 'leg-2',
        selectionName: 'Over 2.5 Goals',
        marketName: 'Goals Over/Under',
        odds: 1.8,
        status: randomStatus === 'Pending' ? 'Pending' : 'Won',
      },
    ],
  };
};

export default function BetDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [betSlip, setBetSlip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch bet data
  useEffect(() => {
    const fetchBet = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Try to get from API
        const betResponse = await getBetById(id);
        
        if (betResponse && betResponse.legs && betResponse.legs.length > 0) {
          // Transform API response to BetSlip format
          // For accumulator bets, we need to fetch fixture data for each leg
          // For now, use the first leg's fixtureId to get match info
          const firstLeg = betResponse.legs[0];
          
          // TODO: Fetch fixture data for each leg to display match info
          // For now, use a simplified structure
          const transformedBet = {
            id: betResponse.id,
            matchId: String(firstLeg.fixtureId),
            homeTeam: 'Team A', // TODO: Fetch from fixture
            awayTeam: 'Team B', // TODO: Fetch from fixture
            homeTeamLogo: '', // TODO: Fetch from fixture
            awayTeamLogo: '', // TODO: Fetch from fixture
            homeScore: undefined,
            awayScore: undefined,
            matchTime: 'TBD',
            matchDate: new Date().toISOString(),
            wagerAmount: betResponse.stake,
            status: betResponse.status === 'PENDING' ? 'Pending' : 
                    betResponse.status === 'WON' ? 'Won' : 
                    betResponse.status === 'LOST' ? 'Lost' : 'Pending',
            legs: betResponse.legs.map((leg: any) => ({
              id: leg.id,
              selectionName: formatSelectionName(leg.marketType, leg.selection),
              marketName: getMarketDisplayName(leg.marketType),
              odds: leg.odd || 1.0,
              status: leg.status === 'PENDING' ? 'Pending' : 
                      leg.status === 'WON' ? 'Won' : 
                      leg.status === 'LOST' ? 'Lost' : 'Pending',
            })),
            totalOdds: betResponse.totalOdds,
            potentialWinnings: betResponse.potentialWinnings,
          };
          setBetSlip(transformedBet);
        } else {
          // Fallback to hardcoded mock data
          const fallbackBet = generateMockBetSlip(id);
          setBetSlip(fallbackBet);
        }
      } catch (error) {
        console.error('Error fetching bet:', error);
        // Fallback to hardcoded mock data
        const fallbackBet = generateMockBetSlip(id);
        setBetSlip(fallbackBet);
      } finally {
        setLoading(false);
      }
    };

    fetchBet();
  }, [id]);

  // Calculate total odds (use from bet response if available, otherwise calculate)
  const totalOdds = useMemo(() => {
    if (!betSlip) return 0;
    // Use totalOdds from response if available
    if ((betSlip as any).totalOdds) return (betSlip as any).totalOdds;
    // Otherwise calculate from legs
    if (betSlip.legs.length === 0) return 0;
    return betSlip.legs.reduce((acc, leg) => acc * leg.odds, 1);
  }, [betSlip]);

  // Calculate potential winnings (use from bet response if available, otherwise calculate)
  const potentialWinnings = useMemo(() => {
    if (!betSlip) return 0;
    // Use potentialWinnings from response if available
    if ((betSlip as any).potentialWinnings) return (betSlip as any).potentialWinnings;
    // Otherwise calculate
    return Math.round(betSlip.wagerAmount * totalOdds);
  }, [betSlip, totalOdds]);

  // Determine global status based on legs
  const globalStatus = useMemo(() => {
    if (!betSlip) return 'Pending';
    
    const hasLost = betSlip.legs.some((leg) => leg.status === 'Lost');
    const allWon = betSlip.legs.every((leg) => leg.status === 'Won');
    const allPending = betSlip.legs.every((leg) => leg.status === 'Pending');

    if (hasLost) return 'Lost';
    if (allWon) return 'Won';
    if (allPending) return 'Pending';
    return 'Pending'; // Mixed statuses default to pending
  }, [betSlip]);

  // Status color helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won':
        return '#22c55e'; // Green
      case 'Lost':
        return '#ef4444'; // Red
      case 'Pending':
        return '#6b7280'; // Grey
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Won':
        return <Ionicons name="checkmark" size={20} color="#fff" />;
      case 'Lost':
        return <Ionicons name="close" size={20} color="#fff" />;
      case 'Pending':
        return <Ionicons name="time-outline" size={20} color="#fff" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>BET DETAILS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading bet details...
          </Text>
        </View>
      </View>
    );
  }

  if (!betSlip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>BET DETAILS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Bet not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>BET DETAILS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Match Header Card */}
        <View style={[styles.matchCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.matchHeader}>
            <View style={styles.teamInfo}>
              <Image source={{ uri: betSlip.homeTeamLogo }} style={styles.teamLogo} />
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {betSlip.homeTeam}
              </Text>
              {betSlip.homeScore !== undefined && (
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {betSlip.homeScore}
                </Text>
              )}
            </View>
            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>VS</Text>
            </View>
            <View style={styles.teamInfo}>
              <Image source={{ uri: betSlip.awayTeamLogo }} style={styles.teamLogo} />
              <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                {betSlip.awayTeam}
              </Text>
              {betSlip.awayScore !== undefined && (
                <Text style={[styles.score, { color: theme.colors.text }]}>
                  {betSlip.awayScore}
                </Text>
              )}
            </View>
          </View>

          {/* Total Odds */}
          <View style={[styles.oddsContainer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
            <Text style={[styles.oddsLabel, { color: theme.colors.textSecondary }]}>
              Total Odds
            </Text>
            <Text style={[styles.oddsValue, { color: theme.colors.primary }]}>
              x{totalOdds.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Bet Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Wager Amount
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {betSlip.wagerAmount} PTS
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Potential Winnings
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
              {potentialWinnings} PTS
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Status
            </Text>
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(globalStatus) },
                ]}
              >
                {getStatusIcon(globalStatus)}
                <Text style={styles.statusBadgeText}>{globalStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Legs Section */}
        <View style={styles.legsSection}>
          <Text style={[styles.legsTitle, { color: theme.colors.text }]}>
            BET LEGS ({betSlip.legs.length})
          </Text>

          {betSlip.legs.map((leg, index) => (
            <View
              key={leg.id}
              style={[
                styles.legCard,
                { backgroundColor: theme.colors.cardBackground },
                index === betSlip.legs.length - 1 && styles.lastLegCard,
              ]}
            >
              <View style={styles.legHeader}>
                <View style={[styles.legNumberContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Text style={[styles.legNumber, { color: theme.colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.legInfo}>
                  <Text style={[styles.marketName, { color: theme.colors.textSecondary }]}>
                    {leg.marketName}
                  </Text>
                  <Text style={[styles.selectionName, { color: theme.colors.text }]}>
                    {leg.selectionName}
                  </Text>
                </View>
                <View style={styles.legRight}>
                  <Text style={[styles.legOdds, { color: theme.colors.primary }]}>
                    x{leg.odds.toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.legStatusIcon,
                      { backgroundColor: getStatusColor(leg.status) },
                    ]}
                  >
                    {getStatusIcon(leg.status)}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },

  // Match Card
  matchCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
  },
  score: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  oddsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  oddsLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  oddsValue: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
  },

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },

  // Legs Section
  legsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  legsTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  legCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lastLegCard: {
    marginBottom: 0,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  legNumber: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  legInfo: {
    flex: 1,
    gap: 4,
  },
  marketName: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  selectionName: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  legRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  legOdds: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  legStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

