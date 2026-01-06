// app/(tabs)/dashboard.tsx
// Admin Dashboard Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/context/ThemeContext';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';

type TabType = 'USERS' | 'BETS' | 'MATCHES';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const { totalUsers, totalActiveUsers, users, logs, loading, error } = useDashboardUsers();

  // Transform chart data for react-native-gifted-charts
  const transformChartData = (data: Array<{ x: string; y: number }>) => {
    // Get last 7 days for display
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const maxValue = Math.max(...data.map(d => d.y), 1);
    
    return data.slice(-7).map((point, index) => ({
      value: point.y,
      label: days[index % 7],
      labelTextStyle: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontFamily: 'Montserrat_400Regular',
      },
    }));
  };

  const totalUsersData = transformChartData(totalUsers);
  const activeUsersData = transformChartData(totalActiveUsers);
  const maxChartValue = Math.max(
    ...totalUsers.map(d => d.y),
    ...totalActiveUsers.map(d => d.y),
    4000
  );

  // Calculate total users count
  const totalUsersCount = totalUsers.reduce((sum, point) => sum + point.y, 0);
  const totalActiveUsersCount = totalActiveUsers.reduce((sum, point) => sum + point.y, 0);
  const activeUsersPercentage = totalUsersCount > 0 
    ? ((totalActiveUsersCount / totalUsersCount) * 100).toFixed(1)
    : '0.0';

  // Get top 5 users
  const topUsers = users
    .sort((a, b) => (b.totalPoints || b.points || 0) - (a.totalPoints || a.points || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Ionicons name="menu" size={24} color={theme.colors.text} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>DASHBOARD</Text>
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Ionicons name="menu" size={24} color={theme.colors.text} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>DASHBOARD</Text>
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0a0e27', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: '#1a1f3a' }]}>
        <Ionicons name="menu" size={24} color="#ffffff" />
        <Text style={styles.headerTitle}>DASHBOARD</Text>
        <Ionicons name="search" size={24} color="#ffffff" />
      </View>

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'USERS' && styles.tabActive]}
          onPress={() => setActiveTab('USERS')}
        >
          <Text style={[styles.tabText, activeTab === 'USERS' && styles.tabTextActive]}>USERS</Text>
          {activeTab === 'USERS' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'BETS' && styles.tabActive]}
          onPress={() => setActiveTab('BETS')}
        >
          <Text style={[styles.tabText, activeTab === 'BETS' && styles.tabTextActive]}>BETS</Text>
          {activeTab === 'BETS' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'MATCHES' && styles.tabActive]}
          onPress={() => setActiveTab('MATCHES')}
        >
          <Text style={[styles.tabText, activeTab === 'MATCHES' && styles.tabTextActive]}>MATCHES</Text>
          {activeTab === 'MATCHES' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'USERS' && (
          <>
            {/* Total Users Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>TOTAL USERS</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={totalUsersData}
                  width={300}
                  height={150}
                  color="#3b82f6"
                  thickness={2}
                  maxValue={maxChartValue}
                  yAxisColor="#1a1f3a"
                  xAxisColor="#1a1f3a"
                  rulesColor="#1a1f3a"
                  backgroundColor="transparent"
                  hideYAxisText={false}
                  yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
                  yAxisLabelSuffix="k"
                  formatYLabel={(value) => {
                    const num = parseInt(value);
                    return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : value;
                  }}
                  dataPointsColor="#3b82f6"
                  dataPointsRadius={3}
                  spacing={40}
                />
              </View>
              <Text style={styles.chartValue}>{totalUsersCount.toLocaleString()}</Text>
            </View>

            {/* Total Active Users Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>TOTAL ACTIVE USERS</Text>
                <View style={styles.percentageBadge}>
                  <Ionicons name="ellipse" size={8} color="#10b981" />
                  <Text style={styles.percentageText}>{activeUsersPercentage}%</Text>
                </View>
              </View>
              <View style={styles.chartContainer}>
                <LineChart
                  data={activeUsersData}
                  width={300}
                  height={150}
                  color="#10b981"
                  thickness={2}
                  maxValue={maxChartValue}
                  yAxisColor="#1a1f3a"
                  xAxisColor="#1a1f3a"
                  rulesColor="#1a1f3a"
                  backgroundColor="transparent"
                  hideYAxisText={false}
                  yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
                  yAxisLabelSuffix="k"
                  formatYLabel={(value) => {
                    const num = parseInt(value);
                    return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : value;
                  }}
                  dataPointsColor="#10b981"
                  dataPointsRadius={3}
                  spacing={40}
                />
              </View>
            </View>

            {/* Users List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>USERS</Text>
                <Text style={styles.sectionSubtitle}>{users.length} results</Text>
              </View>
              {topUsers.map((user, index) => (
                <View key={user.id || index} style={styles.userCard}>
                  <Image
                    source={{
                      uri: user.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=3b82f6&color=fff&size=200`,
                    }}
                    style={styles.userAvatar}
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userPoints}>
                      {(user.totalPoints || user.points || 0).toLocaleString()} POINTS
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            {/* Logs Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>LOGS</Text>
                <Text style={styles.sectionSubtitle}>{logs.length} rows</Text>
              </View>
              {logs.length > 0 ? (
                logs.slice(0, 8).map((log, index) => {
                  // Format timestamp to HH:mm:ss.SSS format
                  const timestamp = log.timestamp 
                    ? new Date(log.timestamp).toLocaleTimeString('en-US', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        fractionalSecondDigits: 3
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
    borderBottomWidth: 1,
    backgroundColor: '#0a0e27',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0e27',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f3a',
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
    backgroundColor: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  chartCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chartValue: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    marginTop: 8,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#10b981',
  },
  section: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#6b7280',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userPoints: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#6b7280',
  },
  viewAllButton: {
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#ffffff',
  },
  logRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f1419',
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#6b7280',
  },
});

