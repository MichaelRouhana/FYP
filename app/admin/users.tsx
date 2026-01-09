// app/admin/users.tsx
// All Users Page with Search - Robust Implementation

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
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchAllUsers, DashboardUser, PagedResponse } from '@/services/dashboardApi';

export default function AdminUsersPage() {
  const colorScheme = useColorScheme() ?? 'light';
  
  // State
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 1. Fetch Function with Strict Guards
  const fetchUsers = useCallback(async (pageNum: number, searchQuery: string, shouldReset: boolean = false) => {
    // STRICT GUARD: Block parallel requests
    if (loading) {
      console.log('⚠️ Fetch blocked: Already loading');
      return;
    }

    // STRICT GUARD: Don't fetch if we know there's no more data (for pagination)
    if (pageNum > 0 && !hasMore) {
      console.log('⚠️ Fetch blocked: No more data available');
      return;
    }

    setLoading(true);

    try {
      // Handle empty search - send undefined to backend
      const query = searchQuery.trim() === '' ? undefined : searchQuery.trim();
      
      const response: PagedResponse<DashboardUser> = await fetchAllUsers(pageNum, query);
      
      if (shouldReset) {
        // New search or initial load - replace data
        setUsers(response.content);
      } else {
        // Pagination - append data with duplicate filtering
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = response.content.filter((u: DashboardUser) => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      }

      // Stop if backend says this is the last page
      setHasMore(!response.last);
      setPage(pageNum);

    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      
      // CRITICAL: If we get a 429, STOP trying to fetch more to prevent loop
      if (error.response?.status === 429) {
        console.error('🚫 Rate limited (429) - Stopping fetch loop');
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // 2. Initial Load / Search Change with Debounce
  useEffect(() => {
    // Reset everything when search changes
    setHasMore(true);
    setPage(0);
    
    // Debounce: Add delay to prevent fetching on every keystroke
    const timeoutId = setTimeout(() => {
      fetchUsers(0, search, true);
    }, search ? 600 : 0); // 600ms delay when typing, immediate when clearing

    return () => clearTimeout(timeoutId);
  }, [search, fetchUsers]);

  // 3. Load More Handler with Strict Guards
  const loadMore = useCallback(() => {
    // STRICT GUARDS: Only load more if:
    // 1. Not currently loading
    // 2. There's more data available
    // 3. We have existing users (prevents firing on empty list)
    if (!loading && hasMore && users.length > 0) {
      fetchUsers(page + 1, search, false);
    }
  }, [loading, hasMore, users.length, page, search, fetchUsers]);

  // Render User Row
  const renderUserRow = ({ item }: { item: DashboardUser }) => {
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

  // Footer Component - Manual "Load More" Button
  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
        </View>
      );
    }
    
    if (hasMore && users.length > 0) {
      return (
        <TouchableOpacity
          onPress={loadMore}
          style={[
            styles.loadMoreButton,
            { backgroundColor: Colors[colorScheme].card }
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.loadMoreText, { color: Colors[colorScheme].tint }]}>
            Load More Users
          </Text>
        </TouchableOpacity>
      );
    }
    
    if (users.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={[styles.noMoreText, { color: Colors[colorScheme].muted }]}>
            No more users
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Empty Component
  const renderEmpty = () => {
    if (loading) return null; // Don't show empty message while loading
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

        {/* User List - Manual "Load More" (No Automatic Scrolling) */}
        <FlashList
          data={users}
          renderItem={renderUserRow}
          estimatedItemSize={80}
          keyExtractor={(item) => item.id.toString()}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={users.length === 0 ? styles.emptyList : styles.listContent}
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
  loadMoreButton: {
    padding: 15,
    alignItems: 'center',
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noMoreText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
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
  listContent: {
    paddingBottom: 40,
  },
});
