// components/dashboard/DashboardBets.tsx
// Bets Tab Component for Admin Dashboard

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardBets } from '@/hooks/useDashboardBets';
import DashboardChart from './DashboardChart';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardBets() {
  const { theme, isDark } = useTheme();
  const {
    filter,
    setFilter,
    totalBets,
    wonBets,
    lostBets,
    stats,
    topBetters,
    topPointers,
    loading,
    error,
  } = useDashboardBets();

  // Transform chart data for react-native-gifted-charts
  const transformChartData = (data: Array<{ x: string; y: number }>) => {
    if (!data || data.length === 0) {
      // Return dummy data with curves
      return [
        { value: 3500, label: 'MON' },
        { value: 4200, label: 'TUE' },
        { value: 2800, label: 'WED' },
        { value: 4500, label: 'THU' },
        { value: 3800, label: 'FRI' },
        { value: 4800, label: 'SAT' },
        { value: 3600, label: 'SUN' },
      ];
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return data.slice(-7).map((point, index) => ({
      value: point.y,
      label: days[index % 7],
    }));
  };

  const totalBetsData = transformChartData(totalBets);
  const wonBetsData = transformChartData(wonBets);
  const lostBetsData = transformChartData(lostBets);

  // Get top 3 betters
  const top3Betters = topBetters.slice(0, 3);

  // Get top 3 pointers (already sorted by backend)
  const top3Pointers = topPointers.slice(0, 3);

  // Get trophy icon based on rank
  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={24} color="#FFD700" />; // Gold
      case 2:
        return <Ionicons name="medal" size={24} color="#C0C0C0" />; // Silver
      case 3:
        return <Ionicons name="medal" size={24} color="#CD7F32" />; // Bronze
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading bets data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter Header */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.headerBackground }]}>
        <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Time Range:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: filter === '24h' ? theme.colors.primary : theme.colors.cardBackground,
                borderColor: filter === '24h' ? theme.colors.primary : theme.colors.border,
              },
              filter === '24h' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('24h')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === '24h' ? '#ffffff' : theme.colors.textSecondary }
            ]}>
              24 Hours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: filter === '7d' ? theme.colors.primary : theme.colors.cardBackground,
                borderColor: filter === '7d' ? theme.colors.primary : theme.colors.border,
              },
              filter === '7d' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('7d')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === '7d' ? '#ffffff' : theme.colors.textSecondary }
            ]}>
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: filter === 'all' ? theme.colors.primary : theme.colors.cardBackground,
                borderColor: filter === 'all' ? theme.colors.primary : theme.colors.border,
              },
              filter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === 'all' ? '#ffffff' : theme.colors.textSecondary }
            ]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section A: The 3 Charts */}
      <DashboardChart
        title="TOTAL BETS"
        data={totalBetsData}
        color="#818CF8"
        badgeValue="1.3%"
        bigNumber={stats.totalBets}
      />

      <DashboardChart
        title="WON BETS"
        data={wonBetsData}
        color="#10B981"
        badgeValue="1.3%"
        bigNumber={stats.wonBets}
      />

      <DashboardChart
        title="LOST BETS"
        data={lostBetsData}
        color="#EF4444"
        badgeValue="1.3%"
        bigNumber={stats.lostBets}
      />

      {/* Section B: Top Betters Leaderboard */}
      <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>TOP BETTERS</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{topBetters.length} results</Text>
          </View>
        </View>
        {top3Betters.length > 0 ? (
          <>
            {top3Betters.map((user, index) => {
              const rank = index + 1;
              return (
                <View key={user.id || index} style={[styles.listRow, { borderBottomColor: theme.colors.separator }]}>
                  <View style={[styles.rankContainer, { backgroundColor: theme.colors.border }]}>
                    <Text style={[styles.rankText, { color: theme.colors.text }]}>#{rank}</Text>
                  </View>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={[styles.avatar, { backgroundColor: theme.colors.border }]}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={[styles.listRowTitle, { color: theme.colors.text }]}>{user.username?.toUpperCase()}</Text>
                    <Text style={[styles.listRowSubtitle, { color: theme.colors.textSecondary }]}>
                      {(user.totalBets || 0).toLocaleString()} BETS
                    </Text>
                  </View>
                  {getTrophyIcon(rank)}
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No betters data available</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.viewAllButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
          onPress={() => router.push('/admin/betters')}
        >
          <Text style={[styles.viewAllButtonText, { color: theme.colors.text }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      {/* Section B: Top Points Leaderboard */}
      <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>TOP POINTS</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{topPointers.length} results</Text>
          </View>
        </View>
        {top3Pointers.length > 0 ? (
          <>
            {top3Pointers.map((user, index) => {
              const rank = index + 1;
              return (
                <View key={user.id || index} style={[styles.listRow, { borderBottomColor: theme.colors.separator }]}>
                  <View style={[styles.rankContainer, { backgroundColor: theme.colors.border }]}>
                    <Text style={[styles.rankText, { color: theme.colors.text }]}>#{rank}</Text>
                  </View>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={[styles.avatar, { backgroundColor: theme.colors.border }]}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={[styles.listRowTitle, { color: theme.colors.text }]}>{user.username?.toUpperCase()}</Text>
                    <Text style={[styles.listRowSubtitle, { color: theme.colors.textSecondary }]}>
                      {(user.totalPoints || user.points || 0).toLocaleString()} PTS
                    </Text>
                  </View>
                  {getTrophyIcon(rank)}
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No points data available</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.viewAllButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
          onPress={() => router.push('/admin/points')}
        >
          <Text style={[styles.viewAllButtonText, { color: theme.colors.text }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonActive: {
    // Active state handled inline
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  filterButtonTextActive: {
    // Active state handled inline
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  listRowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listRowTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  listRowSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  viewAllButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
});
