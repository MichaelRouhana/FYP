// app/admin/betters.tsx
// Top Betters Leaderboard

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchTopBetters, DashboardUser, PagedResponse } from '@/services/dashboardApi';

export default function AdminBettersPage() {
  const colorScheme = useColorScheme() ?? 'light';
  const [data, setData] = useState<DashboardUser[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch top betters
  const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loading || loadingMore) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response: PagedResponse<DashboardUser> = await fetchTopBetters(pageNum);
      
      if (append) {
        setData(prev => [...prev, ...response.content]);
      } else {
        setData(response.content);
      }

      setTotalPages(response.totalPages);
      setHasMore(!response.last && response.content.length > 0);
    } catch (error) {
      console.error('Error fetching top betters:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loading, loadingMore]);

  // Initial load
  useEffect(() => {
    fetchData(0, false);
  }, []);

  // Load more when page changes
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [page, hasMore, loadingMore, loading, fetchData]);

  const renderUserRow = ({ item, index }: { item: DashboardUser; index: number }) => {
    const rank = page * 20 + index + 1; // Calculate rank based on page and index
    const avatarUrl = item.pfp || item.avatarUrl || `https://ui-avatars.com/api/?name=${item.username}&background=16a34a&color=fff&size=200`;
    const wins = item.totalWins || item.wonBets || 0;
    const winRate = item.winRate || 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.userRow,
          { backgroundColor: Colors[colorScheme].card, borderBottomColor: Colors[colorScheme].muted + '20' }
        ]}
        onPress={() => router.push(`/player/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Rank */}
        <View style={[styles.rankContainer, { backgroundColor: Colors[colorScheme].tint + '20' }]}>
          <Text style={[styles.rankText, { color: Colors[colorScheme].tint }]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: Colors[colorScheme].text }]}>
            {item.username}
          </Text>
          {item.country && (
            <Text style={[styles.country, { color: Colors[colorScheme].muted }]}>
              {item.country}
            </Text>
          )}
        </View>

        {/* Wins/Win Rate Badge */}
        <View style={styles.statsContainer}>
          <View style={[styles.winsBadge, { backgroundColor: Colors[colorScheme].success + '20' }]}>
            <Text style={[styles.winsText, { color: Colors[colorScheme].success }]}>
              {wins} {wins === 1 ? 'Win' : 'Wins'}
            </Text>
          </View>
          {winRate > 0 && (
            <Text style={[styles.winRateText, { color: Colors[colorScheme].muted }]}>
              {winRate.toFixed(1)}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: Colors[colorScheme].muted }]}>
          No users available
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
          Top Betters
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Leaderboard List */}
      <FlashList
        data={data}
        renderItem={renderUserRow}
        estimatedItemSize={80}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={data.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  country: {
    fontSize: 12,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  winsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  winsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  winRateText: {
    fontSize: 11,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
});

