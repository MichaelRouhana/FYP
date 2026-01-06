// app/(tabs)/dashboard.tsx
// Admin Dashboard Screen - Clean Premium Implementation

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import Colors from '@/constants/Colors';

type TabType = 'USERS' | 'BETS' | 'MATCHES';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const [refreshing, setRefreshing] = useState(false);
  const { totalUsers, totalActiveUsers, users, logs, loading, error, refetch } = useDashboardUsers();

  // Transform chart data for react-native-gifted-charts
  const transformChartData = (data: Array<{ x: string; y: number }>) => {
    if (!data || data.length === 0) {
      // Return dummy data for smooth chart rendering
      return Array.from({ length: 7 }, (_, i) => ({
        value: Math.random() * 1000 + 500,
        label: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i],
      }));
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return data.slice(-7).map((point, index) => ({
      value: point.y,
      label: days[index % 7],
    }));
  };

  const totalUsersData = transformChartData(totalUsers);
  const activeUsersData = transformChartData(totalActiveUsers);
  const maxChartValue = Math.max(
    ...totalUsers.map(d => d.y),
    ...totalActiveUsers.map(d => d.y),
    4000,
    1
  );

  // Calculate totals
  const totalUsersCount = totalUsers.reduce((sum, point) => sum + point.y, 0) || 0;
  const totalActiveUsersCount = totalActiveUsers.reduce((sum, point) => sum + point.y, 0) || 0;
  const activeUsersPercentage = totalUsersCount > 0
    ? ((totalActiveUsersCount / totalUsersCount) * 100).toFixed(1)
    : '0.0';

  // Get top 5 users
  const topUsers = users
    .sort((a, b) => (b.totalPoints || b.points || 0) - (a.totalPoints || a.points || 0))
    .slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderChart = (data: any[], color: string) => (
    <View style={styles.chartWrapper}>
      <LineChart
        data={data}
        width={280}
        height={50}
        color={color}
        thickness={2}
        maxValue={maxChartValue}
        curved={true}
        areaChart={true}
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.4}
        endOpacity={0}
        hideAxesAndRules={true}
        hideDataPoints={true}
        spacing={35}
        initialSpacing={0}
        endSpacing={0}
        backgroundColor="transparent"
      />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'USERS' && styles.tabActive]}
          onPress={() => setActiveTab('USERS')}
        >
          <Text style={[styles.tabText, activeTab === 'USERS' && styles.tabTextActive]}>
            USERS
          </Text>
          {activeTab === 'USERS' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'BETS' && styles.tabActive]}
          onPress={() => setActiveTab('BETS')}
        >
          <Text style={[styles.tabText, activeTab === 'BETS' && styles.tabTextActive]}>
            BETS
          </Text>
          {activeTab === 'BETS' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'MATCHES' && styles.tabActive]}
          onPress={() => setActiveTab('MATCHES')}
        >
          <Text style={[styles.tabText, activeTab === 'MATCHES' && styles.tabTextActive]}>
            MATCHES
          </Text>
          {activeTab === 'MATCHES' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
      >
        {activeTab === 'USERS' && (
          <>
            {/* Stats Grid - 2 Columns */}
            <View style={styles.statsGrid}>
              {/* Total Users Card */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statValue}>{totalUsersCount.toLocaleString()}</Text>
                {renderChart(totalUsersData, '#3b82f6')}
              </View>

              {/* Active Users Card */}
              <View style={styles.statCard}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.statLabel}>Active Users</Text>
                  <View style={styles.percentageBadge}>
                    <Ionicons name="ellipse" size={6} color="#22c55e" />
                    <Text style={styles.percentageText}>{activeUsersPercentage}%</Text>
                  </View>
                </View>
                <Text style={styles.statValue}>{totalActiveUsersCount.toLocaleString()}</Text>
                {renderChart(activeUsersData, '#22c55e')}
              </View>
            </View>

            {/* Users Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Users</Text>
                <Text style={styles.sectionSubtitle}>{users.length} results</Text>
              </View>
              {topUsers.map((user, index) => (
                <View key={user.id || index} style={styles.listRow}>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={styles.avatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={styles.listRowTitle}>{user.username}</Text>
                    <Text style={styles.listRowSubtitle}>
                      {(user.totalPoints || user.points || 0).toLocaleString()} POINTS
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            {/* System Logs Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>System Logs</Text>
                <Text style={styles.sectionSubtitle}>{logs.length} rows</Text>
              </View>
              {logs.length > 0 ? (
                logs.slice(0, 8).map((log, index) => {
                  const timestamp = log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3,
                      })
                    : 'N/A';

                  return (
                    <View key={log.id || index} style={styles.logRow}>
                      <Text style={styles.logText}>
                        {index + 1} {timestamp} INFO {log.username} {log.action} - {log.details}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.logRow}>
                  <Text style={styles.logText}>No logs available</Text>
                </View>
              )}
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'BETS' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>BETS tab coming soon</Text>
          </View>
        )}

        {activeTab === 'MATCHES' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>MATCHES tab coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    // Active styling handled by text color
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_600SemiBold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#22c55e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  chartWrapper: {
    height: 50,
    overflow: 'hidden',
    marginTop: 8,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#22c55e',
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2C2C2E',
  },
  listRowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listRowTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  listRowSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#9ca3af',
  },
  viewAllButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  logRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#9ca3af',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#9ca3af',
  },
});
