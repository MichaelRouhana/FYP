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
import { getBetById } from '@/services/betApi';
import { BetResponseDTO, BetStatus } from '@/types/bet';

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
        // Fetch bet from API (now includes match details)
        const betResponse: BetResponseDTO = await getBetById(id);
        
        if (!betResponse || !betResponse.legs || betResponse.legs.length === 0) {
          console.error('Invalid bet response:', betResponse);
          setBetSlip(null);
          setLoading(false);
          return;
        }

        // Extract fixtureId from the first leg (for navigation/reference)
        const firstLeg = betResponse.legs[0];
        const fixtureId = firstLeg.fixtureId;

        // Format match date and time from betResponse.matchDate
        const matchDateObj = betResponse.matchDate ? new Date(betResponse.matchDate) : new Date();
        const matchDate = matchDateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const matchTime = matchDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        // Determine if match is finished but bet is still pending
        const finishedStatuses = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
        const isMatchFinished = betResponse.matchStatus ? finishedStatuses.includes(betResponse.matchStatus) : false;
        const isBetPending = betResponse.status === BetStatus.PENDING;
        const showAwaitingSettlement = isMatchFinished && isBetPending;

        // Transform API response to BetSlip format using bet fields directly
        const transformedBet = {
          id: betResponse.id,
          matchId: String(fixtureId || betResponse.id),
          homeTeam: betResponse.homeTeam || 'Team A',
          awayTeam: betResponse.awayTeam || 'Team B',
          homeTeamLogo: betResponse.homeTeamLogo || '',
          awayTeamLogo: betResponse.awayTeamLogo || '',
          homeScore: betResponse.homeScore,
          awayScore: betResponse.awayScore,
          matchTime,
          matchDate,
          wagerAmount: betResponse.stake,
          status: betResponse.status === BetStatus.PENDING ? 'Pending' : 
                  betResponse.status === BetStatus.WON ? 'Won' : 
                  betResponse.status === BetStatus.LOST ? 'Lost' : 'Pending',
          legs: betResponse.legs.map((leg: any) => ({
            id: leg.id,
            selectionName: formatSelectionName(leg.marketType, leg.selection),
            marketName: getMarketDisplayName(leg.marketType),
            odds: leg.odd || 1.0,
            status: leg.status === BetStatus.PENDING ? 'Pending' : 
                    leg.status === BetStatus.WON ? 'Won' : 
                    leg.status === BetStatus.LOST ? 'Lost' : 'Pending',
          })),
          totalOdds: betResponse.totalOdds,
          potentialWinnings: betResponse.potentialWinnings,
          showAwaitingSettlement,
          fixtureStatus: betResponse.matchStatus || 'NS',
        };
        
        setBetSlip(transformedBet);
      } catch (error) {
        console.error('Error fetching bet:', error);
        setBetSlip(null);
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

  // Determine global status based on bet response status (already calculated on backend)
  const globalStatus = useMemo(() => {
    if (!betSlip) return 'Pending';
    // Use the status from betSlip which comes from betResponse.status
    return betSlip.status === 'won' ? 'Won' : 
           betSlip.status === 'lost' ? 'Lost' : 'Pending';
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
          {(betSlip as any)?.showAwaitingSettlement && (
            <View style={[styles.awaitingSettlementContainer, { backgroundColor: isDark ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.2)' }]}>
              <Ionicons name="warning" size={16} color="#FFC107" />
              <Text style={[styles.awaitingSettlementText, { color: '#FFC107' }]}>
                Match finished - Awaiting settlement
              </Text>
            </View>
          )}
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
  awaitingSettlementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  awaitingSettlementText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
});

