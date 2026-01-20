// app/(tabs)/dashboard.tsx
// Admin Dashboard Screen - Clean Premium Implementation

import DashboardBets from '@/components/dashboard/DashboardBets';
import { useTheme } from '@/context/ThemeContext';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'USERS' | 'BETS';

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const [refreshing, setRefreshing] = useState(false);
  const { totalUsers, totalActiveUsers, users, logs, loading, error, refetch } = useDashboardUsers();

  // Transform chart data for react-native-gifted-charts
  const transformChartData = (data: Array<{ x: string; y: number }>) => {
    if (!data || data.length === 0) {
      // Return empty array instead of dummy data
      return [];
    }

    // Map day names
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    return data.slice(-7).map((point) => {
      // Parse the date string (format: YYYY-MM-DD)
      const date = new Date(point.x);
      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay();
      const dayLabel = dayNames[dayOfWeek];
      
      return {
        value: point.y,
        label: dayLabel,
      };
    });
  };

  const totalUsersData = transformChartData(totalUsers);
  const activeUsersData = transformChartData(totalActiveUsers);
  const maxChartValue = Math.max(
    ...(totalUsers.length > 0 ? totalUsers.map(d => d.y) : [0]),
    ...(totalActiveUsers.length > 0 ? totalActiveUsers.map(d => d.y) : [0]),
    1
  );

  // Calculate totals
  const totalUsersCount = totalUsers.reduce((sum, point) => sum + point.y, 0) || 0;
  const totalActiveUsersCount = totalActiveUsers.reduce((sum, point) => sum + point.y, 0) || 0;
  const activeUsersPercentage = totalUsersCount > 0
    ? ((totalActiveUsersCount / totalUsersCount) * 100).toFixed(1)
    : '0.0';

  // Get top 5 users sorted by points (descending)
  const topUsers = users
    .map(user => ({
      ...user,
      // Ensure we get the actual points value from the backend
      displayPoints: user.totalPoints ?? user.points ?? 0,
    }))
    .sort((a, b) => b.displayPoints - a.displayPoints)
    .slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderChart = (data: any[], color: string) => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80; // Account for padding
    
    // Handle empty data
    if (!data || data.length === 0) {
      return (
        <View style={[styles.chartWrapper, { height: 180, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            No data available
          </Text>
        </View>
      );
    }
    
    // Calculate dynamic max value from actual data
    const maxDataValue = Math.max(...data.map(item => item.value), 1);
    // Round up to next "nice" number with 20% padding to prevent line touching top edge
    const chartCeiling = Math.ceil(maxDataValue + (maxDataValue * 0.2));
    
    return (
      <View style={styles.chartWrapper}>
        <LineChart
          data={data}
          areaChart={true}
          curved={false}
          maxValue={chartCeiling}
          noOfSections={4}
          height={180}
          width={chartWidth}
          spacing={44}
          initialSpacing={10}
          color={color}
          thickness={2}
          hideDataPoints={true}
          startFillColor={color}
          endFillColor={isDark ? '#1F2937' : '#F3F4F6'}
          startOpacity={0.4}
          endOpacity={0.0}
          yAxisColor="transparent"
          xAxisColor="transparent"
          yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10, marginTop: 6 }}
          rulesType="dashed"
          rulesColor={theme.colors.separator}
          hideRules={false}
          showVerticalLines={true}
          verticalLinesColor={theme.colors.separator}
        />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
      </View>

      {/* Top Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.headerBackground, borderBottomColor: theme.colors.separator }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'USERS' && styles.tabActive]}
          onPress={() => setActiveTab('USERS')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'USERS' ? theme.colors.text : theme.colors.textSecondary }, activeTab === 'USERS' && styles.tabTextActive]}>
            USERS
          </Text>
          {activeTab === 'USERS' && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'BETS' && styles.tabActive]}
          onPress={() => setActiveTab('BETS')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'BETS' ? theme.colors.text : theme.colors.textSecondary }, activeTab === 'BETS' && styles.tabTextActive]}>
            BETS
          </Text>
          {activeTab === 'BETS' && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {activeTab === 'USERS' && (
          <>
            {/* Total Users Card - Full Width */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>TOTAL USERS</Text>
              {renderChart(totalUsersData, '#818CF8')}
            </View>

            {/* Active Users Card - Full Width */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.statCardHeader}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>TOTAL ACTIVE USERS</Text>
                <View style={styles.percentageBadge}>
                  <Ionicons name="ellipse" size={6} color="#22c55e" />
                  <Text style={styles.percentageText}>{activeUsersPercentage}%</Text>
                </View>
              </View>
              {renderChart(activeUsersData, '#818CF8')}
            </View>

            {/* Users Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Users</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{users.length} results</Text>
              </View>
              {topUsers.map((user, index) => (
                <View key={user.id || index} style={[styles.listRow, { borderBottomColor: theme.colors.separator }]}>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={[styles.avatar, { backgroundColor: theme.colors.border }]}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.listRowContent}>
                    <Text style={[styles.listRowTitle, { color: theme.colors.text }]}>{user.username}</Text>
                    <Text style={[styles.listRowSubtitle, { color: theme.colors.textSecondary }]}>
                      {((user as any).displayPoints ?? user.totalPoints ?? user.points ?? 0).toLocaleString()} POINTS
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/admin/users')}
              >
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            {/* System Logs Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>System Logs</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{logs.length} rows</Text>
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
                    <View key={log.id || index} style={[styles.logRow, { borderBottomColor: theme.colors.separator }]}>
                      <Text style={[styles.logText, { color: theme.colors.textSecondary }]}>
                        {index + 1} {timestamp} INFO {log.username} {log.action} - {log.details}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={[styles.logRow, { borderBottomColor: theme.colors.separator }]}>
                  <Text style={[styles.logText, { color: theme.colors.textSecondary }]}>No logs available</Text>
                </View>
              )}
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'BETS' && <DashboardBets />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
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
  },
  tabTextActive: {
    fontFamily: 'Montserrat_600SemiBold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
    paddingBottom: 100,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
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
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chartWrapper: {
    marginLeft: -10,
    overflow: 'hidden',
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
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
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
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  listRowSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
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
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
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
    color: '#9CA3AF',
  },
});
