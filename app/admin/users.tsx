// app/admin/users.tsx
// All Users Page with Search

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchAllUsers, DashboardUser, PagedResponse } from '@/services/dashboardApi';

export default function AdminUsersPage() {
  const colorScheme = useColorScheme() ?? 'light';
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Fetch users with proper guards
  const fetchUsers = useCallback(async (pageNum: number, searchQuery: string = '') => {
    // Prevent double fetching
    if (loading) return;
    
    // Prevent fetching if we know there's no more data (for pagination)
    if (pageNum > 0 && !hasMore) return;

    setLoading(true);

    try {
      // Fix: Pass undefined if search is empty so backend gets null/undefined
      const query = searchQuery.trim() === '' ? undefined : searchQuery.trim();
      
      const response: PagedResponse<DashboardUser> = await fetchAllUsers(pageNum, query);
      
      if (pageNum === 0) {
        // First page or new search - replace data
        setUsers(response.content);
      } else {
        // Pagination - append data
        setUsers(prev => [...prev, ...response.content]);
      }

      // Check if we reached the end
      setHasMore(!response.last);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [loading, hasMore]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      // When search changes, reset to page 0 and fetch
      setPage(0);
      setHasMore(true); // Reset guard
      fetchUsers(0, search);
    }, search ? 600 : 0); // No delay for clearing search (empty string)

    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  // Initial load on mount
  useEffect(() => {
    if (!initialLoaded) {
      fetchUsers(0, '');
    }
  }, [initialLoaded, fetchUsers]);

  // Load more handler with proper guards
  const loadMore = useCallback(() => {
    // CRITICAL: Only load more if:
    // 1. Not currently loading
    // 2. There's more data available
    // 3. Initial load has completed
    if (!loading && hasMore && initialLoaded) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, search);
    }
  }, [loading, hasMore, initialLoaded, page, search, fetchUsers]);

  const renderUserRow = ({ item, index }: { item: DashboardUser; index: number }) => {
    const avatarUrl = item.pfp || item.avatarUrl || `https://ui-avatars.com/api/?name=${item.username}&background=16a34a&color=fff&size=200`;
    
    return (
      <TouchableOpacity
        style={[
          styles.userRow,
          { backgroundColor: Colors[colorScheme].card, borderBottomColor: Colors[colorScheme].muted + '20' }
        ]}
        onPress={() => router.push(`/player/${item.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: Colors[colorScheme].text }]}>
            {item.username}
          </Text>
          {item.roles && item.roles.length > 0 && (
            <Text style={[styles.role, { color: Colors[colorScheme].muted }]}>
              {item.roles.join(', ')}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors[colorScheme].muted}
        />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !initialLoaded) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: Colors[colorScheme].muted }]}>
          {search.trim() ? 'No users found' : 'No users available'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
            All Users
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme].card }]}>
          <Ionicons
            name="search"
            size={20}
            color={Colors[colorScheme].muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Search users..."
            placeholderTextColor={Colors[colorScheme].muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={Colors[colorScheme].muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* User List */}
        <FlashList
          data={users}
          renderItem={renderUserRow}
          estimatedItemSize={70}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={users.length === 0 ? styles.emptyList : undefined}
        />
      </SafeAreaView>
    </>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  role: {
    fontSize: 12,
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
