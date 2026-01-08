import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
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
import { useBettingHistory } from '@/hooks/useBettingHistory';
import { useUserBalance } from '@/hooks/useUserBalance';
import { useFocusEffect } from 'expo-router';

type FilterType = 'all' | 'pending' | 'results';

export default function BiddingScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { loading, allBidsByDate, pendingBidsByDate, resultBidsByDate, refetch } = useBettingHistory();
  const { balance } = useUserBalance();
  const [filter, setFilter] = useState<FilterType>('all');

  // Refresh bets when screen comes into focus (only once per focus)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (isMounted) {
        refetch();
      }
      return () => {
        isMounted = false;
      };
    }, [refetch])
  );

  const getFilteredBids = (): BidsByDate[] => {
    switch (filter) {
      case 'pending':
        return pendingBidsByDate;
      case 'results':
        return resultBidsByDate;
      default:
        return allBidsByDate;
    }
  };

  const filteredBids = getFilteredBids();

  const handleMatchPress = (bid: any) => {
    // Use numeric ID directly (no more mock bets with "bet-1" format)
    router.push({
      pathname: '/bidding/[id]',
      params: { id: String(bid.id) },
    });
  };

  const getPointsColor = (status: 'won' | 'lost' | 'pending') => {
    switch (status) {
      case 'won':
        return theme.colors.primary;
      case 'lost':
        return '#ef4444';
      case 'pending':
        return theme.colors.text;
    }
  };

  const renderStatusIcon = (status: 'won' | 'lost' | 'pending') => {
    switch (status) {
      case 'won':
        return (
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
        );
      case 'lost':
        return (
          <View style={[styles.statusIcon, styles.statusIconLost]}>
            <Ionicons name="close" size={20} color="#fff" />
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusIcon, styles.statusIconPending]}>
            <Ionicons name="time-outline" size={20} color="#fff" />
          </View>
        );
    }
  };

  const renderBidCard = (bid: any) => {
    // Defensive: handle null matchTime
    const timeparts = (bid.matchTime || '').split(' ');
    return (
      <TouchableOpacity
        key={bid.id}
        style={[styles.bidCard, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleMatchPress(bid)}
        activeOpacity={0.7}
      >
        {/* Time */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
            {timeparts[0] || bid.matchTime}
          </Text>
          {timeparts[1] && (
            <Text style={[styles.timePeriod, { color: theme.colors.textSecondary }]}>
              {timeparts[1]}
            </Text>
          )}
        </View>

        {/* Teams and Score */}
        <View style={styles.matchInfoContainer}>
          {/* Home Team */}
          <View style={styles.teamRow}>
            <Image source={{ uri: bid.homeTeamLogo }} style={styles.teamLogo} />
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {bid.homeTeam}
            </Text>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {bid.homeScore ?? '-'}
            </Text>
          </View>

          {/* Away Team */}
          <View style={styles.teamRow}>
            <Image source={{ uri: bid.awayTeamLogo }} style={styles.teamLogo} />
            <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {bid.awayTeam}
            </Text>
            <Text style={[styles.score, { color: theme.colors.text }]}>
              {bid.awayScore ?? '-'}
            </Text>
          </View>
        </View>

        {/* Points and Status */}
        <View style={styles.statusContainer}>
          <Text style={[styles.pointsText, { color: getPointsColor(bid.status) }]}>
            {bid.points} PTS
          </Text>
          {renderStatusIcon(bid.status)}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateSection = (section: any) => (
    <View key={section.date} style={styles.dateSection}>
      <Text style={[styles.dateHeader, { color: theme.colors.text }]}>
        {section.date}
      </Text>
      {section.bids.map(renderBidCard)}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>BIDDING</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={[
          styles.balanceCard,
          { backgroundColor: theme.colors.cardBackground }
        ]}>
          <View>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Available Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.primary }]}>
              {balance} PTS
            </Text>
          </View>
          <Ionicons name="wallet-outline" size={32} color={theme.colors.primary} />
        </View>

        {/* Matches Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>MATCHES</Text>
          <View style={[styles.sectionUnderline, { backgroundColor: theme.colors.primary }]} />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && { backgroundColor: theme.colors.primary },
              filter !== 'all' && { borderColor: theme.colors.text, borderWidth: 1 },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'all' ? '#fff' : theme.colors.text },
              ]}
            >
              ALL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'pending' && { backgroundColor: theme.colors.primary },
              filter !== 'pending' && { borderColor: theme.colors.text, borderWidth: 1 },
            ]}
            onPress={() => setFilter('pending')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'pending' ? '#fff' : theme.colors.text },
              ]}
            >
              PENDING
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'results' && { backgroundColor: theme.colors.primary },
              filter !== 'results' && { borderColor: theme.colors.text, borderWidth: 1 },
            ]}
            onPress={() => setFilter('results')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'results' ? '#fff' : theme.colors.text },
              ]}
            >
              RESULTS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading your bets...
            </Text>
          </View>
        )}

        {/* Bids List */}
        {!loading && filteredBids.length > 0 ? (
          <View style={styles.bidsContainer}>
            {filteredBids.map(renderDateSection)}
          </View>
        ) : !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No bids found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Start placing bids on matches to see them here
            </Text>
          </View>
        ) : null}

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
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 1,
  },
  searchButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  sectionUnderline: {
    width: 80,
    height: 3,
    marginTop: 8,
    borderRadius: 2,
  },

  // Filters
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },

  // Bids Container
  bidsContainer: {
    paddingHorizontal: 16,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Bid Card
  bidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  timePeriod: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  matchInfoContainer: {
    flex: 1,
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  score: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconLost: {
    backgroundColor: '#ef4444',
  },
  statusIconPending: {
    backgroundColor: '#6b7280',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Balance Card
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Montserrat_900Black',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
});
