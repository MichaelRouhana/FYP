import { GoalPowerChart, TeamBalanceChart, TeamPowerChart } from '@/components/charts';
import { useTheme } from '@/context/ThemeContext';
import { CommentaryItem, getMatchCommentary } from '@/mock/matchCommentary';
import { getMatchDetails } from '@/mock/matchDetails';
import { getH2HData, H2HMatch } from '@/mock/matchH2H';
import { getMatchLineups, getRatingColor, Player } from '@/mock/matchLineups';
import { getMatchPowerData } from '@/mock/matchPower';
import { CHART_COLORS } from '@/mock/matchPower/constants';
import { getMatchStats } from '@/mock/matchStats';
import { eventLegend, EventType, getMatchSummary, MatchEvent } from '@/mock/matchSummary';
import { getMatchTable, TeamStanding } from '@/mock/matchTable';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchData } from '@/hooks/useMatchData';
import { useUserBalance } from '@/hooks/useUserBalance';
import { placeBet, createMatchWinnerBet } from '@/services/betApi';

type TabType = 'details' | 'predictions' | 'summary' | 'lineups' | 'stats' | 'h2h' | 'table' | 'power' | 'commentary';
type BetSelection = 'home' | 'draw' | 'away' | null;
type GoalsOverUnder = 'x1' | '12' | 'x2' | null;
type BothTeamsScore = 'yes' | 'no' | null;
type FirstTeamScore = 'home' | 'away' | null;
type DoubleChance = 'x1' | '12' | 'x2' | null;

const TABS: { id: TabType; label: string }[] = [
  { id: 'details', label: 'DETAILS' },
  { id: 'predictions', label: 'PREDICTIONS' },
  { id: 'summary', label: 'SUMMARY' },
  { id: 'lineups', label: 'LINEUP' },
  { id: 'table', label: 'STANDINGS' },
  { id: 'commentary', label: 'COMMENTARY' },
  { id: 'stats', label: 'STATS' },
  { id: 'h2h', label: 'H2H' },
  { id: 'power', label: 'POWER' },
];

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  
  // Fetch real data from API
  const { loading, error, matchData } = useMatchData(id || '');
  const { balance, refetch: refetchBalance } = useUserBalance();
  const [submitting, setSubmitting] = useState(false);
  
  // All state hooks MUST be called unconditionally
  const [selectedTab, setSelectedTab] = useState<TabType>('details');
  const [h2hFilter, setH2hFilter] = useState<'meetings' | 'home' | 'away'>('meetings');
  const [h2hShowAll, setH2hShowAll] = useState(false);
  const [tableFilter, setTableFilter] = useState<'all' | 'home' | 'away'>('all');
  const [betSelection, setBetSelection] = useState<BetSelection>(null);
  const [stake, setStake] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Predictions state
  const [goalsOverUnder, setGoalsOverUnder] = useState<GoalsOverUnder>(null);
  const [bothTeamsScore, setBothTeamsScore] = useState<BothTeamsScore>(null);
  const [firstTeamScore, setFirstTeamScore] = useState<FirstTeamScore>(null);
  const [doubleChance, setDoubleChance] = useState<DoubleChance>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  // Keep mock data for tabs that aren't integrated yet
  const summary = getMatchSummary(id || 'default');
  const lineups = getMatchLineups(id || 'default');
  const stats = getMatchStats(id || 'default');
  const h2h = getH2HData(id || 'default');
  const table = getMatchTable(id || 'default');
  const commentary = getMatchCommentary(id || 'default');
  const powerData = getMatchPowerData(id || 'default');

  // Transform API data to match UI expectations (with null checks)
  const match = matchData ? {
    id: matchData.fixture.id,
    homeTeam: {
      name: matchData.teams.home.name,
      logo: matchData.teams.home.logo,
    },
    awayTeam: {
      name: matchData.teams.away.name,
      logo: matchData.teams.away.logo,
    },
    homeScore: matchData.goals.home ?? 0,
    awayScore: matchData.goals.away ?? 0,
    league: matchData.league.name,
    date: new Date(matchData.fixture.date).toLocaleDateString(),
    matchTime: matchData.fixture.status.short === 'FT' ? 'FT' : 
               matchData.fixture.status.short === 'NS' ? new Date(matchData.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
               `${matchData.fixture.status.elapsed || 0}'`,
    venue: {
      name: matchData.fixture.venue.name || 'Unknown Venue',
      location: matchData.fixture.venue.city || 'Unknown City',
      capacity: 'N/A',
      surface: 'N/A',
    },
    weather: {
      condition: 'N/A',
      temperature: 'N/A',
    },
    odds: {
      home: 1.85,
      draw: 3.40,
      away: 2.10,
    },
    isFavorite: isFavorite,
  } : null;

  const potentialWinnings = useMemo(() => {
    if (!stake || !betSelection || !match) return 0;
    const stakeNum = parseFloat(stake) || 0;
    const odds =
      betSelection === 'home'
        ? match.odds.home
        : betSelection === 'draw'
        ? match.odds.draw
        : match.odds.away;
    return Math.round(stakeNum * odds);
  }, [stake, betSelection, match]);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: isDark ? '#ffffff' : '#18223A', marginTop: 16, fontSize: 14 }}>Loading match data...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !matchData || !match) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={isDark ? '#9ca3af' : '#6B7280'} />
        <Text style={{ color: isDark ? '#ffffff' : '#18223A', marginTop: 16, fontSize: 16, textAlign: 'center' }}>
          Failed to load match data
        </Text>
        <Text style={{ color: isDark ? '#9ca3af' : '#6B7280', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
          {error || 'Please try again later'}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 24, backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDetailsTab = () => (
    <View style={styles.detailsContainer}>
      {/* User Balance */}
      <View style={[
        styles.balanceCard,
        {
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        <Text style={[styles.balanceLabel, { color: isDark ? '#9ca3af' : '#6B7280' }]}>
          Available Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: '#22c55e' }]}>
          {balance} PTS
        </Text>
      </View>

      {/* Betting Card */}
      <View style={[
        styles.bettingCard, 
        { 
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        <Text style={[styles.bettingTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>Who will win?</Text>

        {/* Bet Options */}
        <View style={[styles.betOptionsContainer, { borderWidth: isDark ? 0 : 1, borderColor: '#18223A' }]}>
          <TouchableOpacity
            style={[
              styles.betOption,
              { backgroundColor: isDark ? '#0E1C1C' : '#0E1C1C' },
              betSelection === 'home' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('home')}
          >
            <Text style={styles.betOptionLabel}>HOME</Text>
            <Text style={styles.betOptionOdds}>{match.odds.home}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              { backgroundColor: isDark ? '#080C17' : '#D1D5DB' },
              betSelection === 'draw' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('draw')}
          >
            <Text style={[styles.betOptionLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>DRAW</Text>
            <Text style={[styles.betOptionOdds, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{match.odds.draw}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.betOption,
              styles.betOptionAway,
              betSelection === 'away' && styles.betOptionSelected,
            ]}
            onPress={() => setBetSelection('away')}
          >
            <Text style={[styles.betOptionLabel, styles.betOptionLabelAway]}>AWAY</Text>
            <Text style={[styles.betOptionOdds, styles.betOptionOddsAway]}>{match.odds.away}x</Text>
          </TouchableOpacity>
        </View>

        {/* Stake Input */}
        <Text style={[styles.stakeLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Stake</Text>
        <View style={[
          styles.stakeInputContainer, 
          { 
            backgroundColor: isDark ? '#080C17' : '#F3F4F6',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          <TextInput
            style={[styles.stakeInput, { color: isDark ? '#ffffff' : '#18223A' }]}
            placeholder="Enter your stake"
            placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
            value={stake}
            onChangeText={setStake}
            keyboardType="numeric"
          />
          <Text style={[styles.stakeUnit, { color: isDark ? '#ffffff' : '#18223A' }]}>pts</Text>
        </View>

        {/* Potential Winnings */}
        <View style={[
          styles.potentialWinningsContainer,
          {
            backgroundColor: isDark ? '#0E1C1C' : '#E8F5E9',
            borderColor: isDark ? '#142A28' : '#32A95D',
          }
        ]}>
          <View style={styles.potentialWinningsLeft}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color={isDark ? '#2B5555' : '#32A95D'} />
            <Text style={[styles.potentialWinningsText, { color: isDark ? '#2B5555' : '#32A95D' }]}>Potential Winnings</Text>
          </View>
          <Text style={[styles.potentialWinningsAmount, { color: isDark ? '#22c55e' : '#32A95D' }]}>{potentialWinnings} pts</Text>
        </View>

        {/* Place Bid Button */}
        <TouchableOpacity 
          style={[
            styles.placeBidButton, 
            { backgroundColor: isDark ? '#22c55e' : '#18223A' },
            (submitting || !betSelection || !stake) && { opacity: 0.5 }
          ]} 
          activeOpacity={0.8}
          onPress={async () => {
            if (!betSelection || !stake) {
              Alert.alert('Error', 'Please select an option and enter your stake');
              return;
            }

            const stakeNum = parseFloat(stake);
            if (isNaN(stakeNum) || stakeNum <= 0) {
              Alert.alert('Error', 'Please enter a valid stake amount');
              return;
            }

            if (stakeNum > balance) {
              Alert.alert('Insufficient Balance', `You only have ${balance} points available`);
              return;
            }

            try {
              setSubmitting(true);
              const betRequest = createMatchWinnerBet(
                Number(id),
                betSelection.toUpperCase() as 'HOME' | 'DRAW' | 'AWAY'
              );
              
              await placeBet(betRequest);
              
              Alert.alert(
                'Success',
                `Bet placed successfully!\nSelection: ${betSelection.toUpperCase()}\nStake: ${stake} pts\nPotential Return: ${potentialWinnings} pts`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setBetSelection(null);
                      setStake('');
                      refetchBalance();
                    },
                  },
                ]
              );
            } catch (error: any) {
              const message = error.response?.data?.message || error.message || 'Failed to place bet. Please try again.';
              Alert.alert('Error', message);
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || !betSelection || !stake}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.placeBidButtonText}>PLACE BID</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Match Info Card */}
      <View style={[
        styles.matchInfoCard,
        {
          backgroundColor: isDark ? '#101828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}>
        {/* Venue */}
        <View style={[styles.infoRow, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <MaterialCommunityIcons name="map-marker" size={24} color={isDark ? '#6b7280' : '#18223A'} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.name}</Text>
            <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>{match.venue.location}</Text>
          </View>
        </View>

        {/* Capacity & Surface */}
        <View style={[styles.infoRowDouble, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="account-group" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.capacity}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Capacity</Text>
            </View>
          </View>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="grass" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.venue.surface}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Surface</Text>
            </View>
          </View>
        </View>

        {/* Weather & Temperature */}
        <View style={[styles.infoRowDouble, { borderBottomWidth: 0 }]}>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.weather.condition}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Weather</Text>
            </View>
          </View>
          <View style={styles.infoHalf}>
            <MaterialCommunityIcons name="thermometer" size={24} color={isDark ? '#6b7280' : '#6B7280'} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoValueText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.weather.temperature}</Text>
              <Text style={[styles.infoLabelText, { color: isDark ? '#B3B3B3' : '#6B7280' }]}>Temperature</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#9ca3af" />;
      case 'own_goal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'yellow_card':
        return <View style={[styles.cardIcon, styles.yellowCard]} />;
      case 'red_card':
        return <View style={[styles.cardIcon, styles.redCard]} />;
      case 'two_yellow_card':
  return (
          <View style={styles.twoYellowCard}>
            <View style={[styles.cardIconSmall, styles.yellowCard]} />
            <View style={[styles.cardIconSmall, styles.redCard, styles.cardOverlap]} />
          </View>
        );
      case 'substitution':
        return <MaterialCommunityIcons name="swap-vertical" size={18} color="#22c55e" />;
      case 'penalty_scored':
        return <MaterialCommunityIcons name="soccer" size={16} color="#22c55e" />;
      case 'penalty_missed':
        return <MaterialCommunityIcons name="soccer" size={16} color="#ef4444" />;
      case 'canceled_goal':
        return <MaterialCommunityIcons name="soccer-field" size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const renderEventRow = (event: MatchEvent) => {
    const isHome = event.team === 'home';
    const isSubstitution = event.type === 'substitution';
    const hasScore = event.score && (event.type === 'goal' || event.type === 'own_goal' || event.type === 'penalty_scored');

    return (
      <View key={event.id} style={[styles.eventRow, { borderBottomColor: isDark ? '#1A253D' : '#E5E7EB' }]}>
        {/* Home team side */}
        <View style={styles.eventSide}>
          {isHome && (
            <View style={styles.eventContent}>
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={[styles.playerNameSubIn, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
                  <Text style={[styles.playerNameSubOut, { color: isDark ? '#919191' : '#6B7280' }]}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={[styles.playerNameSingle, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
              )}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {getEventIcon(event.type)}
            </View>
          )}
        </View>

        {/* Time in center */}
        <Text style={[styles.eventTime, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.time}</Text>

        {/* Away team side */}
        <View style={styles.eventSide}>
          {!isHome && (
            <View style={[styles.eventContent, styles.eventContentAway]}>
              {getEventIcon(event.type)}
              {hasScore && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{event.score}</Text>
                </View>
              )}
              {isSubstitution ? (
                <View style={styles.substitutionNames}>
                  <Text style={[styles.playerNameSubIn, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
                  <Text style={[styles.playerNameSubOut, { color: isDark ? '#919191' : '#6B7280' }]}>{event.playerOut}</Text>
                </View>
              ) : (
                <Text style={[styles.playerNameSingle, { color: isDark ? '#ffffff' : '#18223A' }]}>{event.playerName}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPredictionsTab = () => {
    const handleSubmitPredictions = () => {
      // TODO: Submit predictions to backend
      console.log('Submitting predictions:', {
        goalsOverUnder,
        bothTeamsScore,
        firstTeamScore,
        doubleChance,
        homeScore,
        awayScore,
      });
    };

    return (
      <View style={styles.predictionsContainer}>
        {/* Goals Over/Under */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            GOALS OVER/UNDER
          </Text>
          <View style={styles.predictionOptions}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                goalsOverUnder === 'x1' && styles.predictionButtonSelected,
              ]}
              onPress={() => setGoalsOverUnder('x1')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  goalsOverUnder === 'x1' && styles.predictionButtonTextSelected,
                ]}
              >
                X1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                goalsOverUnder === '12' && styles.predictionButtonSelected,
              ]}
              onPress={() => setGoalsOverUnder('12')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  goalsOverUnder === '12' && styles.predictionButtonTextSelected,
                ]}
              >
                12
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                goalsOverUnder === 'x2' && styles.predictionButtonSelected,
              ]}
              onPress={() => setGoalsOverUnder('x2')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  goalsOverUnder === 'x2' && styles.predictionButtonTextSelected,
                ]}
              >
                X2
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Both Teams to Score */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            BOTH TEAMS TO SCORE
          </Text>
          <View style={styles.predictionOptions}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                bothTeamsScore === 'yes' && styles.predictionButtonSelected,
              ]}
              onPress={() => setBothTeamsScore('yes')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  bothTeamsScore === 'yes' && styles.predictionButtonTextSelected,
                ]}
              >
                YES
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                bothTeamsScore === 'no' && styles.predictionButtonSelected,
              ]}
              onPress={() => setBothTeamsScore('no')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  bothTeamsScore === 'no' && styles.predictionButtonTextSelected,
                ]}
              >
                NO
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* First Team to Score */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            FIRST TEAM TO SCORE
          </Text>
          <View style={styles.predictionOptions}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                firstTeamScore === 'home' && styles.predictionButtonSelected,
              ]}
              onPress={() => setFirstTeamScore('home')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  firstTeamScore === 'home' && styles.predictionButtonTextSelected,
                ]}
              >
                HOME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                styles.predictionButtonWide,
                { backgroundColor: theme.colors.cardBackground },
                firstTeamScore === 'away' && styles.predictionButtonSelected,
              ]}
              onPress={() => setFirstTeamScore('away')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  firstTeamScore === 'away' && styles.predictionButtonTextSelected,
                ]}
              >
                AWAY
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Double Chance */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            DOUBLE CHANCE
          </Text>
          <View style={styles.predictionOptions}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                doubleChance === 'x1' && styles.predictionButtonSelected,
              ]}
              onPress={() => setDoubleChance('x1')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  doubleChance === 'x1' && styles.predictionButtonTextSelected,
                ]}
              >
                X1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                doubleChance === '12' && styles.predictionButtonSelected,
              ]}
              onPress={() => setDoubleChance('12')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  doubleChance === '12' && styles.predictionButtonTextSelected,
                ]}
              >
                12
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                { backgroundColor: theme.colors.cardBackground },
                doubleChance === 'x2' && styles.predictionButtonSelected,
              ]}
              onPress={() => setDoubleChance('x2')}
            >
              <Text
                style={[
                  styles.predictionButtonText,
                  { color: theme.colors.text },
                  doubleChance === 'x2' && styles.predictionButtonTextSelected,
                ]}
              >
                X2
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Prediction */}
        <View style={styles.predictionSection}>
          <Text style={[styles.predictionTitle, { color: theme.colors.text }]}>
            SCORE PREDICTION
          </Text>
          <View style={styles.scoreInputsContainer}>
            <View style={styles.scoreInputWrapper}>
              <Text style={[styles.scoreInputLabel, { color: theme.colors.textSecondary }]}>
                Home Score
              </Text>
              <TextInput
                style={[
                  styles.scoreInput,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                value={homeScore}
                onChangeText={(text) => {
                  // Only allow numbers 0-99
                  const num = text.replace(/[^0-9]/g, '');
                  if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 99)) {
                    setHomeScore(num);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.scoreInputWrapper}>
              <Text style={[styles.scoreInputLabel, { color: theme.colors.textSecondary }]}>
                Away Score
              </Text>
              <TextInput
                style={[
                  styles.scoreInput,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                value={awayScore}
                onChangeText={(text) => {
                  // Only allow numbers 0-99
                  const num = text.replace(/[^0-9]/g, '');
                  if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 99)) {
                    setAwayScore(num);
                  }
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitPredictionsButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmitPredictions}
          activeOpacity={0.8}
        >
          <Text style={styles.submitPredictionsButtonText}>SUBMIT PREDICTIONS</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSummaryTab = () => {
    // Split events into first half and second half
    const firstHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time <= 45 || e.time.includes('45+');
    });
    const secondHalfEvents = summary.events.filter((e) => {
      const time = parseInt(e.time.replace("'", '').replace('+', ''));
      return time > 45 && !e.time.includes('45+');
    });

    return (
      <View style={styles.summaryContainer}>
        {/* Events Timeline Card */}
        <View style={[
          styles.timelineCard,
          {
            backgroundColor: isDark ? '#101828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Match End Whistle */}
          <View style={[styles.whistleRow, { backgroundColor: isDark ? '#101828' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="whistle" size={24} color={isDark ? '#22c55e' : '#32A95D'} />
          </View>

          {/* Full Time */}
          <View style={[styles.scoreRow, { backgroundColor: isDark ? '#1A253D' : '#D1D5DB' }]}>
            <Text style={[styles.scoreRowText, { color: isDark ? '#ffffff' : '#18223A' }]}>{summary.fulltimeScore} FT</Text>
          </View>

          {/* Second Half Events (reversed to show latest first) */}
          {[...secondHalfEvents].reverse().map((event) => renderEventRow(event))}

          {/* Half Time */}
          <View style={[styles.scoreRow, { backgroundColor: isDark ? '#1A253D' : '#D1D5DB' }]}>
            <Text style={[styles.scoreRowText, { color: isDark ? '#ffffff' : '#18223A' }]}>{summary.halftimeScore} HT</Text>
          </View>

          {/* First Half Events (reversed to show latest first) */}
          {[...firstHalfEvents].reverse().map((event) => renderEventRow(event))}

          {/* Match Start Whistle */}
          <View style={[styles.whistleRow, { backgroundColor: isDark ? '#101828' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="whistle" size={24} color={isDark ? '#22c55e' : '#32A95D'} />
          </View>
        </View>

        {/* Legend Card */}
        <View style={[
          styles.legendCard,
          {
            backgroundColor: isDark ? '#101828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {eventLegend.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              {getEventIcon(item.type)}
              <Text style={[styles.legendText, { color: isDark ? '#ffffff' : '#18223A' }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPlayerNode = (player: Player) => (
    <TouchableOpacity 
      key={player.id} 
      style={styles.playerNode}
      onPress={() => router.push(`/player/${player.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.playerPhoto}>
        <Text style={styles.playerInitial}>{player.name.charAt(0)}</Text>
      </View>
      <View style={[styles.playerRating, { backgroundColor: getRatingColor(player.rating) }]}>
        <Text style={styles.playerRatingText}>{player.rating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFormationRow = (players: Player[]) => (
    <View style={styles.formationRow}>
      {players.map((player) => renderPlayerNode(player))}
    </View>
  );

  const renderSubstituteCard = (player: Player) => (
    <TouchableOpacity 
      key={player.id} 
      style={[
        styles.substituteCard,
        {
          backgroundColor: isDark ? '#111828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: '#18223A',
        }
      ]}
      onPress={() => router.push(`/player/${player.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.substitutePhoto, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
        <Text style={[styles.substituteInitial, { color: isDark ? '#ffffff' : '#18223A' }]}>{player.name.charAt(0)}</Text>
      </View>
      <View style={styles.substituteInfo}>
        <Text style={[styles.substituteName, { color: isDark ? '#ffffff' : '#18223A' }]}>{player.name}</Text>
        <Text style={[styles.substitutePosition, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{player.number} - {player.position}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLineupsTab = () => {
    const { homeTeam, awayTeam } = lineups;

    return (
      <View style={styles.lineupsContainer}>
        {/* Away Team Header */}
        <View style={[
          styles.teamLineupHeader,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }
        ]}>
          <View style={[styles.teamLineupLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            <Text style={[styles.teamLineupLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{awayTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={[styles.teamLineupName, { color: isDark ? '#ffffff' : '#18223A' }]}>{awayTeam.teamName}</Text>
          <Text style={[styles.teamLineupFormation, { color: isDark ? '#B4B4B4' : '#6B7280' }]}>{awayTeam.formation}</Text>
          <View style={styles.teamLineupRating}>
            <Text style={styles.teamLineupRatingText}>{awayTeam.teamRating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <ImageBackground
            source={require('@/images/Field.jpg')}
            style={styles.pitchImage}
            resizeMode="cover"
          >
            {/* Away Team (Top - attacking down) */}
            <View style={styles.teamFormation}>
              {renderFormationRow(awayTeam.starters.goalkeeper)}
              {renderFormationRow(awayTeam.starters.defenders)}
              {renderFormationRow(awayTeam.starters.midfielders)}
              {renderFormationRow(awayTeam.starters.forwards)}
            </View>

            {/* Home Team (Bottom - attacking up) */}
            <View style={styles.teamFormation}>
              {renderFormationRow(homeTeam.starters.forwards)}
              {renderFormationRow(homeTeam.starters.midfielders)}
              {renderFormationRow(homeTeam.starters.defenders)}
              {renderFormationRow(homeTeam.starters.goalkeeper)}
            </View>
          </ImageBackground>
        </View>

        {/* Home Team Header */}
        <View style={[
          styles.teamLineupHeader,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }
        ]}>
          <View style={[styles.teamLineupLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
            <Text style={[styles.teamLineupLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{homeTeam.teamName.charAt(0)}</Text>
          </View>
          <Text style={[styles.teamLineupName, { color: isDark ? '#ffffff' : '#18223A' }]}>{homeTeam.teamName}</Text>
          <Text style={[styles.teamLineupFormation, { color: isDark ? '#B4B4B4' : '#6B7280' }]}>{homeTeam.formation}</Text>
          <View style={styles.teamLineupRating}>
            <Text style={styles.teamLineupRatingText}>{homeTeam.teamRating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Substitutes Section */}
        <View style={styles.substitutesSection}>
          <Text style={[styles.substitutesTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>SUBSTITUTES</Text>
          <View style={styles.substitutesGrid}>
            {[...homeTeam.substitutes, ...awayTeam.substitutes].slice(0, 6).map(renderSubstituteCard)}
          </View>
        </View>
      </View>
    );
  };

  const renderStatBar = (homeValue: number, awayValue: number) => {
    const total = homeValue + awayValue;
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
    
    const homeIsHigher = homeValue >= awayValue;
    const awayIsHigher = awayValue > homeValue;

    return (
      <View style={styles.statBarContainer}>
        {/* Home bar - grows from left toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackHome, { backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
          <View style={styles.statBarHomeWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarHome,
                { 
                  width: `${homePercent}%`,
                  backgroundColor: homeIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
        {/* Away bar - grows from right toward center */}
        <View style={[styles.statBarTrack, styles.statBarTrackAway, { backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
          <View style={styles.statBarAwayWrapper}>
            <View 
              style={[
                styles.statBar, 
                styles.statBarAway,
                { 
                  width: `${awayPercent}%`,
                  backgroundColor: awayIsHigher ? '#3FAC66' : '#7782A2',
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStatsTab = () => {
    return (
      <View style={styles.statsContainer}>
        {/* TOP STATS Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>TOP STATS</Text>

          {/* Ball Possession */}
          <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>Ball possession</Text>
          <View style={[styles.possessionBarContainer, { borderWidth: isDark ? 0 : 1, borderColor: '#18223A' }]}>
            <View style={[styles.possessionBarHome, { flex: stats.possession.home }]}>
              <Text style={styles.possessionText}>{stats.possession.home}%</Text>
            </View>
            <View style={[styles.possessionBarAway, { flex: stats.possession.away, backgroundColor: isDark ? '#111828' : '#E5E7EB' }]}>
              <Text style={[styles.possessionText, { color: isDark ? '#ffffff' : '#18223A' }]}>{stats.possession.away}%</Text>
            </View>
          </View>

          {/* Other Stats */}
          {stats.topStats.map((stat, index) => (
            <View key={`top-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>

        {/* SHOTS Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>SHOTS</Text>

          {stats.shots.map((stat, index) => (
            <View key={`shots-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>

        {/* DISCIPLINES Card */}
        <View style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? '#080C17' : '#FFFFFF',
            borderColor: isDark ? '#1A253D' : '#18223A',
          }
        ]}>
          <Text style={[styles.statsCardTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>DISCIPLINES</Text>

          {stats.disciplines.map((stat, index) => (
            <View key={`disciplines-${index}`} style={styles.statRow}>
              <View style={styles.statRowHeader}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.homeValue}</Text>
                <Text style={[styles.statName, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.name}</Text>
                <Text style={[styles.statValue, styles.statValueRight, { color: isDark ? '#ffffff' : '#18223A' }]}>{stat.awayValue}</Text>
              </View>
              {renderStatBar(stat.homeValue, stat.awayValue)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderH2HMatchRow = (h2hMatch: H2HMatch) => (
    <View key={h2hMatch.id} style={[styles.h2hMatchRow, { borderTopColor: isDark ? '#202D4B' : '#E5E7EB' }]}>
      {/* Home Team */}
      <View style={styles.h2hTeamLeft}>
        <Text style={[styles.h2hTeamName, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.homeTeam}</Text>
        <View style={[styles.h2hTeamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <Text style={[styles.h2hTeamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.homeTeam.charAt(0)}</Text>
        </View>
      </View>

      {/* Center - Date & Score/Time */}
      <View style={styles.h2hMatchCenter}>
        <Text style={[styles.h2hMatchDate, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.date}</Text>
        {h2hMatch.isCompleted ? (
          <View style={styles.h2hScoreRow}>
            <Text style={[styles.h2hScore, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.homeScore}</Text>
            <Text style={[styles.h2hScore, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.awayScore}</Text>
          </View>
        ) : (
          <Text style={[styles.h2hTime, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.time}</Text>
        )}
      </View>

      {/* Away Team */}
      <View style={styles.h2hTeamRight}>
        <View style={[styles.h2hTeamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
          <Text style={[styles.h2hTeamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.awayTeam.charAt(0)}</Text>
        </View>
        <Text style={[styles.h2hTeamName, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hMatch.awayTeam}</Text>
      </View>
    </View>
  );

  const renderH2HTab = () => {
    const total = h2h.stats.homeWins + h2h.stats.draws + h2h.stats.awayWins;
    const homePercent = total > 0 ? (h2h.stats.homeWins / total) * 100 : 0;
    const drawPercent = total > 0 ? (h2h.stats.draws / total) * 100 : 0;
    const awayPercent = total > 0 ? (h2h.stats.awayWins / total) * 100 : 0;

    return (
      <View style={styles.h2hContainer}>
        {/* Filter Tabs */}
        <View style={styles.h2hFilterContainer}>
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'meetings' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('meetings')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'meetings' && styles.h2hFilterTextActive
            ]}>
              MEETINGS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'home' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('home')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'home' && styles.h2hFilterTextActive
            ]}>
              {h2h.homeTeam}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.h2hFilterTab, 
              { 
                backgroundColor: isDark ? '#080C17' : '#FFFFFF',
                borderColor: isDark ? '#ffffff' : '#18223A' 
              },
              h2hFilter === 'away' && styles.h2hFilterTabActive
            ]}
            onPress={() => setH2hFilter('away')}
          >
            <Text style={[
              styles.h2hFilterText, 
              { color: isDark ? '#ffffff' : '#18223A' },
              h2hFilter === 'away' && styles.h2hFilterTextActive
            ]}>
              {h2h.awayTeam}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={[
          styles.h2hStatsCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Stats Summary */}
          <View style={styles.h2hStatsSummary}>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillHome]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.homeWins}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Won</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, { backgroundColor: isDark ? '#FFFFFF' : '#18223A' }]}>
                <Text style={[styles.h2hStatNumber, { color: isDark ? '#000000' : '#FFFFFF' }]}>{h2h.stats.draws}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Drawn</Text>
            </View>
            <View style={styles.h2hStatItem}>
              <View style={[styles.h2hStatPill, styles.h2hStatPillAway]}>
                <Text style={styles.h2hStatNumber}>{h2h.stats.awayWins}</Text>
              </View>
              <Text style={[styles.h2hStatLabel, { color: isDark ? '#ffffff' : '#18223A' }]}>Won</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.h2hProgressBar}>
            <View style={[styles.h2hProgressHome, { flex: homePercent }]} />
            <View style={[styles.h2hProgressDraw, { flex: drawPercent, backgroundColor: isDark ? '#FFFFFF' : '#18223A' }]} />
            <View style={[styles.h2hProgressAway, { flex: awayPercent }]} />
          </View>

          {/* Match History */}
          {(h2hShowAll ? h2h.matches : h2h.matches.slice(0, 6)).map(renderH2HMatchRow)}

          {/* See All / Show Less Button */}
          {h2h.matches.length > 6 && (
            <TouchableOpacity style={[styles.h2hSeeAllButton, { borderTopColor: isDark ? '#202D4B' : '#E5E7EB' }]} onPress={() => setH2hShowAll(!h2hShowAll)}>
              <Text style={[styles.h2hSeeAllText, { color: isDark ? '#ffffff' : '#18223A' }]}>{h2hShowAll ? 'SHOW LESS' : 'SEE ALL MATCHES'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isTeamPlaying = (teamName: string) => {
    // Check if the team is one of the teams playing in this match
    const homeTeamName = match.homeTeam.name.toLowerCase();
    const awayTeamName = match.awayTeam.name.toLowerCase();
    const checkName = teamName.toLowerCase();
    return checkName.includes(homeTeamName) || homeTeamName.includes(checkName) ||
           checkName.includes(awayTeamName) || awayTeamName.includes(checkName);
  };

  const renderTableRow = (team: TeamStanding) => {
    const isHighlighted = isTeamPlaying(team.teamName);
    
    return (
      <View 
        key={team.position} 
        style={[styles.tableRow, isHighlighted && styles.tableRowHighlighted]}
      >
        <View style={[
          styles.tablePositionCircle, 
          { backgroundColor: isDark ? '#2F384C' : '#E5E7EB' },
          isHighlighted && styles.tablePositionCircleHighlighted
        ]}>
          <Text style={[
            styles.tablePositionText, 
            { color: isDark ? '#ffffff' : '#18223A' },
            isHighlighted && styles.tablePositionTextHighlighted
          ]}>
            {team.position}
          </Text>
        </View>
        <Text style={[
          styles.tableTeamName, 
          { color: isDark ? '#ffffff' : '#18223A' },
          isHighlighted && styles.tableTextHighlighted
        ]}>
          {team.teamName}
        </Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.played}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.won}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.drawn}</Text>
        <Text style={[styles.tableStat, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.lost}</Text>
        <Text style={[styles.tableGoals, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>
          {team.goalsFor}:{team.goalsAgainst}
        </Text>
        <Text style={[styles.tablePoints, { color: isDark ? '#ffffff' : '#18223A' }, isHighlighted && styles.tableTextHighlighted]}>{team.points}</Text>
      </View>
    );
  };

  const renderTableTab = () => {
    return (
      <View style={styles.tableContainer}>
        {/* Table Card */}
        <View style={[
          styles.tableCard,
          {
            backgroundColor: isDark ? '#111828' : '#FFFFFF',
            borderWidth: isDark ? 0 : 1,
            borderColor: '#18223A',
          }
        ]}>
          {/* Filter Tabs */}
          <View style={[styles.tableFilterContainer, { borderBottomColor: isDark ? '#222F4E' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#FFFFFF' },
                tableFilter === 'all' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('all')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'all' && styles.tableFilterTextActive
              ]}>
                ALL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#E5E7EB' },
                tableFilter === 'home' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('home')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'home' && styles.tableFilterTextActive
              ]}>
                HOME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tableFilterTab, 
                { backgroundColor: isDark ? '#080C17' : '#E5E7EB' },
                tableFilter === 'away' && styles.tableFilterTabActive
              ]}
              onPress={() => setTableFilter('away')}
            >
              <Text style={[
                styles.tableFilterText, 
                { color: isDark ? '#ffffff' : '#18223A' },
                tableFilter === 'away' && styles.tableFilterTextActive
              ]}>
                AWAY
              </Text>
            </TouchableOpacity>
          </View>

          {/* League Title */}
          <Text style={[styles.tableLeagueTitle, { color: isDark ? '#ffffff' : '#18223A' }]}>{table.leagueName}</Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: isDark ? '#2F384C' : '#E5E7EB' }]}>
            <Text style={[styles.tableHeaderPosition, { color: isDark ? '#485C88' : '#6B7280' }]}>#</Text>
            <Text style={[styles.tableHeaderTeam, { color: isDark ? '#485C88' : '#6B7280' }]}>Team</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>P</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>W</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>D</Text>
            <Text style={[styles.tableHeaderStat, { color: isDark ? '#485C88' : '#6B7280' }]}>L</Text>
            <Text style={[styles.tableHeaderGoals, { color: isDark ? '#485C88' : '#6B7280' }]}>Goals</Text>
            <Text style={[styles.tableHeaderPoints, { color: isDark ? '#485C88' : '#6B7280' }]}>PTS</Text>
          </View>

          {/* Table Rows */}
          {table.standings.map(renderTableRow)}
        </View>
      </View>
    );
  };

  const renderPowerTab = () => {
    return (
      <View style={styles.powerContainer}>
        {/* Team Balance Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>TEAM BALANCE</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            A chart comparing two team's strength and performance
          </Text>
          <TeamBalanceChart
            data={powerData.teamBalance}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>

        {/* Separator */}
        <View style={[styles.powerSeparator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB' }]} />

        {/* Team Power Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>TEAM POWER</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            Comparison of the team's power based on past matches
          </Text>
          <TeamPowerChart
            data={powerData.teamPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>

        {/* Separator */}
        <View style={[styles.powerSeparator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#E5E7EB' }]} />

        {/* Goal Power Section */}
        <View style={styles.powerSection}>
          <Text style={[styles.powerSectionTitle, { color: isDark ? '#FFFFFF' : '#18223A' }]}>GOAL POWER</Text>
          <Text style={[styles.powerSectionDescription, { color: isDark ? '#667085' : '#6B7280' }]}>
            A chart that display's the timing of the goals scored during a match showing when each team found the net
          </Text>
          <GoalPowerChart
            data={powerData.goalPower}
            homeColor={CHART_COLORS.homeTeam}
            awayColor={CHART_COLORS.awayTeam}
            isDark={isDark}
          />
        </View>
      </View>
    );
  };

  const renderCommentaryItem = (item: CommentaryItem) => (
    <View key={item.id} style={[
      styles.commentaryCard,
      {
        backgroundColor: isDark ? '#111828' : '#FFFFFF',
        borderWidth: isDark ? 0 : 1,
        borderColor: '#18223A',
      }
    ]}>
      <View style={[styles.commentaryTimeBadge, { backgroundColor: isDark ? '#ffffff' : '#18223A' }]}>
        <Text style={[styles.commentaryTimeText, { color: isDark ? '#000000' : '#FFFFFF' }]}>{item.time}</Text>
      </View>
      <Text style={[styles.commentaryText, { color: isDark ? '#ffffff' : '#18223A' }]}>{item.text}</Text>
    </View>
  );

  const renderCommentaryTab = () => {
    return (
      <View style={styles.commentaryContainer}>
        {commentary.items.map(renderCommentaryItem)}
      </View>
    );
  };

  const renderPlaceholderTab = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Coming Soon</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#080C17' : '#F3F4F6' }]}>
      {/* Header & Score Section with Gradient */}
      <LinearGradient
        colors={isDark ? ['#202D4B', '#111828', '#080C17'] : ['#FFFFFF', '#FFFFFF', '#F3F4F6']}
        locations={[0, 0.4, 1]}
        style={styles.gradientHeader}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#ffffff' : '#18223A'} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.leagueName, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{match.league}</Text>
            <Text style={[styles.matchDate, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.date}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? '#22c55e' : (isDark ? '#ffffff' : '#18223A')}
            />
          </TouchableOpacity>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamContainer}>
            <View style={[styles.teamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <Text style={[styles.teamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.homeTeam.name.charAt(0)}</Text>
            </View>
            <Text style={[styles.teamName, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.homeTeam.name}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: isDark ? '#ffffff' : '#18223A' }]}>
              {match.homeScore} - {match.awayScore}
            </Text>
            {match.matchTime && <Text style={[styles.matchTimeText, { color: isDark ? '#9ca3af' : '#6B7280' }]}>{match.matchTime}</Text>}
          </View>

          <View style={styles.teamContainer}>
            <View style={[styles.teamLogo, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }]}>
              <Text style={[styles.teamLogoText, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.awayTeam.name.charAt(0)}</Text>
            </View>
            <Text style={[styles.teamName, { color: isDark ? '#ffffff' : '#18223A' }]}>{match.awayTeam.name}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: isDark ? '#1f2937' : '#E5E7EB', backgroundColor: isDark ? 'transparent' : '#FFFFFF' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? '#6b7280' : '#6B7280' },
                  selectedTab === tab.id && [styles.tabTextSelected, { color: isDark ? '#ffffff' : '#18223A' }],
                ]}
              >
                {tab.label}
          </Text>
              {selectedTab === tab.id && <View style={[styles.tabIndicator, { backgroundColor: isDark ? '#22c55e' : '#32A95D' }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={[styles.contentScrollView, { backgroundColor: isDark ? '#080C17' : '#F3F4F6' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTab === 'details' && renderDetailsTab()}
        {selectedTab === 'predictions' && renderPredictionsTab()}
        {selectedTab === 'summary' && renderSummaryTab()}
        {selectedTab === 'lineups' && renderLineupsTab()}
        {selectedTab === 'stats' && renderStatsTab()}
        {selectedTab === 'h2h' && renderH2HTab()}
        {selectedTab === 'table' && renderTableTab()}
        {selectedTab === 'power' && renderPowerTab()}
        {selectedTab === 'commentary' && renderCommentaryTab()}
        {!['details', 'summary', 'lineups', 'stats', 'h2h', 'table', 'power', 'commentary'].includes(selectedTab) && renderPlaceholderTab()}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
  },
  gradientHeader: {
    paddingBottom: 0,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  matchDate: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamLogoText: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  matchTimeText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 4,
  },
  // Tab Navigation
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
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
    color: '#6b7280',
  },
  tabTextSelected: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  // Content
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  detailsContainer: {
    gap: 16,
  },
  // Betting Card
  bettingCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  bettingTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 16,
  },
  betOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  betOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  betOptionDefault: {
    backgroundColor: '#0E1C1C',
  },
  betOptionDraw: {
    backgroundColor: '#080C17',
  },
  betOptionAway: {
    backgroundColor: '#3FAC66',
  },
  betOptionSelected: {
    borderColor: '#24C45F',
  },
  betOptionLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  betOptionLabelAway: {
    color: '#ffffff',
  },
  betOptionOdds: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#9ca3af',
    marginTop: 2,
  },
  betOptionOddsAway: {
    color: '#ffffff',
  },
  stakeLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    marginBottom: 8,
  },
  stakeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080C17',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stakeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    paddingVertical: 14,
  },
  stakeUnit: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  potentialWinningsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1C1C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#142A28',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  potentialWinningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  potentialWinningsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#2B5555',
  },
  potentialWinningsAmount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#22c55e',
  },
  placeBidButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeBidButtonText: {
    fontSize: 15,
    fontFamily: 'Montserrat_900Black',
    color: '#ffffff',
  },
  // Match Info Card
  matchInfoCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: 12,
  },
  infoRowDouble: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  infoHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoValueText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  infoLabelText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#B3B3B3',
    marginTop: 2,
  },
  // Placeholder
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  // Summary Tab
  summaryContainer: {
    gap: 16,
  },
  timelineCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    overflow: 'hidden',
  },
  whistleRow: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#101828',
  },
  scoreRow: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1A253D',
  },
  scoreRowText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A253D',
  },
  eventSide: {
    flex: 1,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  eventContentAway: {
    justifyContent: 'flex-start',
  },
  eventTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
    width: 50,
    textAlign: 'center',
  },
  playerNameSingle: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  substitutionNames: {
    alignItems: 'flex-end',
  },
  playerNameSubIn: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  playerNameSubOut: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#919191',
  },
  scoreBadge: {
    backgroundColor: '#24C45F',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  cardIcon: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  cardIconSmall: {
    width: 10,
    height: 14,
    borderRadius: 2,
  },
  yellowCard: {
    backgroundColor: '#fbbf24',
  },
  redCard: {
    backgroundColor: '#ef4444',
  },
  twoYellowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOverlap: {
    marginLeft: -6,
  },
  // Legend
  legendCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  // Lineups Tab
  lineupsContainer: {
    gap: 0,
  },
  teamLineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  teamLineupLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLineupLogoText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  teamLineupName: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  teamLineupFormation: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#B4B4B4',
    flex: 1,
  },
  teamLineupRating: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  teamLineupRatingText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#000000',
  },
  // Football Pitch
  pitchContainer: {
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  pitchImage: {
    width: '100%',
    aspectRatio: 0.7,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamFormation: {
    paddingVertical: 2,
  },
  formationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  playerNode: {
    alignItems: 'center',
  },
  playerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  playerRating: {
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  playerRatingText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Substitutes
  substitutesSection: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  substitutesTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  substitutesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  substituteCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  substitutePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteInitial: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  substitutePosition: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
    marginTop: 2,
  },
  // Stats Tab
  statsContainer: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#080C17',
    borderWidth: 1,
    borderColor: '#1A253D',
    borderRadius: 12,
    padding: 16,
  },
  statsCardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Possession Bar
  possessionBarContainer: {
    flexDirection: 'row',
    height: 25,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  possessionBarHome: {
    backgroundColor: '#3FAC66',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  possessionBarAway: {
    backgroundColor: '#111828',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  possessionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  // Stat Rows
  statRow: {
    marginBottom: 16,
  },
  statRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statName: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    width: 30,
  },
  statValueRight: {
    textAlign: 'right',
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 15,
    gap: 8,
  },
  statBarTrack: {
    flex: 1,
    height: 15,
    backgroundColor: '#111828',
    overflow: 'hidden',
  },
  statBarTrackHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarTrackAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  statBarHomeWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statBarAwayWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statBar: {
    height: 15,
  },
  statBarHome: {
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  statBarAway: {
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  // H2H Tab
  h2hContainer: {
    gap: 16,
  },
  h2hFilterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  h2hFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  h2hFilterTabActive: {
    backgroundColor: '#32A95D',
    borderColor: '#32A95D',
  },
  h2hFilterText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hFilterTextActive: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  h2hStatsCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  h2hStatsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  h2hStatItem: {
    alignItems: 'center',
  },
  h2hStatPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  h2hStatPillHome: {
    backgroundColor: '#2A50CD',
  },
  h2hStatPillDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hStatPillAway: {
    backgroundColor: '#D3473B',
  },
  h2hStatNumber: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hStatNumberDark: {
    color: '#000000',
  },
  h2hStatLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hProgressBar: {
    flexDirection: 'row',
    height: 8,
    marginBottom: 20,
  },
  h2hProgressHome: {
    backgroundColor: '#2A50CD',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  h2hProgressDraw: {
    backgroundColor: '#FFFFFF',
  },
  h2hProgressAway: {
    backgroundColor: '#D3473B',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  h2hMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hTeamLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  h2hTeamRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  h2hTeamName: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2hTeamLogoText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  h2hMatchCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  h2hMatchDate: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
  },
  h2hScoreRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  h2hScore: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  h2hTime: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginTop: 4,
  },
  h2hSeeAllButton: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#202D4B',
  },
  h2hSeeAllText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  // Table Tab
  tableContainer: {
    gap: 16,
  },
  tableFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222F4E',
    marginBottom: 16,
  },
  tableFilterTab: {
    backgroundColor: '#080C17',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  tableFilterTabActive: {
    backgroundColor: '#3FAC66',
  },
  tableFilterText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  tableFilterTextActive: {
    color: '#ffffff',
  },
  tableCard: {
    backgroundColor: '#111828',
    borderRadius: 12,
    padding: 16,
  },
  tableLeagueTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2F384C',
  },
  tableHeaderPosition: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderTeam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
  },
  tableHeaderStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableHeaderPoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#485C88',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableRowHighlighted: {
    backgroundColor: '#3FAC66',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tablePositionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2F384C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tablePositionCircleHighlighted: {
    backgroundColor: '#ffffff',
  },
  tablePositionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  tablePositionTextHighlighted: {
    color: '#000000',
  },
  tableTeamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
  },
  tableStat: {
    width: 32,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableGoals: {
    width: 50,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tablePoints: {
    width: 36,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableTextHighlighted: {
    color: '#ffffff',
  },
  // Commentary Tab
  commentaryContainer: {
    gap: 12,
  },
  commentaryCard: {
    backgroundColor: '#111828',
    borderRadius: 5,
    padding: 16,
  },
  commentaryTimeBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  commentaryTimeText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#000000',
  },
  commentaryText: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#ffffff',
    lineHeight: 22,
  },
  // Power Tab
  powerContainer: {
    gap: 0,
  },
  powerSection: {
    paddingVertical: 20,
  },
  powerSectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  powerSectionDescription: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
    marginBottom: 20,
  },
  powerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Predictions Tab
  predictionsContainer: {
    gap: 24,
    paddingBottom: 20,
  },
  predictionSection: {
    gap: 12,
  },
  predictionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  predictionOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  predictionButtonWide: {
    flex: 1,
  },
  predictionButtonSelected: {
    backgroundColor: '#22c55e',
  },
  predictionButtonText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  predictionButtonTextSelected: {
    color: '#ffffff',
  },
  scoreInputsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreInputWrapper: {
    flex: 1,
    gap: 8,
  },
  scoreInputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  scoreInput: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    borderWidth: 1,
  },
  submitPredictionsButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitPredictionsButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#101828',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#22c55e',
  },
});
