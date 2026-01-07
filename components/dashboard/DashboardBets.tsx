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
import { Ionicons } from '@expo/vector-icons';
import { useDashboardBets } from '@/hooks/useDashboardBets';
import DashboardChart from './DashboardChart';

export default function DashboardBets() {
  const {
    totalBets,
    wonBets,
    lostBets,
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

  // Get top 3 pointers
  const top3Pointers = topPointers
    .map(user => ({
      ...user,
      displayPoints: user.totalPoints ?? user.points ?? 0,
    }))
    .sort((a, b) => b.displayPoints - a.displayPoints)
    .slice(0, 3);

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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading bets data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Section A: The 3 Charts */}
      <DashboardChart
        title="TOTAL BETS"
        data={totalBetsData}
        color="#818CF8"
        badgeValue="1.3%"
      />

      <DashboardChart
        title="WON BETS"
        data={wonBetsData}
        color="#10B981"
        badgeValue="1.3%"
      />

      <DashboardChart
        title="LOST BETS"
        data={lostBetsData}
        color="#EF4444"
        badgeValue="1.3%"
      />

      {/* Section B: Top Betters Leaderboard */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TOP BETTERS</Text>
            <Text style={styles.sectionSubtitle}>{topBetters.length} results</Text>
          </View>
        </View>
        {top3Betters.length > 0 ? (
          <>
            {top3Betters.map((user, index) => {
              const rank = index + 1;
              return (
                <View key={user.id || index} style={styles.listRow}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>#{rank}</Text>
                  </View>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={styles.avatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={styles.listRowTitle}>{user.username?.toUpperCase()}</Text>
                    <Text style={styles.listRowSubtitle}>
                      {((user as any).totalBets || 0).toLocaleString()} BETS
                    </Text>
                  </View>
                  {getTrophyIcon(rank)}
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No betters data available</Text>
          </View>
        )}
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      {/* Section B: Top Points Leaderboard */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>TOP POINTS</Text>
            <Text style={styles.sectionSubtitle}>{topPointers.length} results</Text>
          </View>
        </View>
        {top3Pointers.length > 0 ? (
          <>
            {top3Pointers.map((user, index) => {
              const rank = index + 1;
              return (
                <View key={user.id || index} style={styles.listRow}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>#{rank}</Text>
                  </View>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={styles.avatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={styles.listRowTitle}>{user.username?.toUpperCase()}</Text>
                    <Text style={styles.listRowSubtitle}>
                      {((user as any).displayPoints ?? user.totalPoints ?? user.points ?? 0).toLocaleString()} POINTS
                    </Text>
                  </View>
                  {getTrophyIcon(rank)}
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No points data available</Text>
          </View>
        )}
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#030712',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#030712',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#EF4444',
  },
  section: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
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
    color: '#F9FAFB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#9CA3AF',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#F9FAFB',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#1F2937',
  },
  listRowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listRowTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  listRowSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9CA3AF',
  },
  viewAllButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#F9FAFB',
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
    color: '#9CA3AF',
  },
});
