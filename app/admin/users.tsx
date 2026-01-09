// app/admin/users.tsx
// All Users Page with Search

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View as ThemedView } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchAllUsers, DashboardUser, PagedResponse } from '@/services/dashboardApi';

export default function AdminUsersPage() {
  const colorScheme = useColorScheme() ?? 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>(undefined);
  const [data, setData] = useState<DashboardUser[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const hasInitialized = useRef(false);

  // Fetch users
  const fetchUsers = useCallback(async (pageNum: number, search: string | undefined, append: boolean = false) => {
    if (loading || loadingMore) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      // Pass undefined if search is empty/undefined to get all users
      const response: PagedResponse<DashboardUser> = await fetchAllUsers(pageNum, search);
      
      if (append) {
        setData(prev => [...prev, ...response.content]);
      } else {
        setData(response.content);
      }

      setTotalPages(response.totalPages);
      setHasMore(!response.last && response.content.length > 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loading, loadingMore]);

  // Initial load on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Load all users immediately on mount
      fetchUsers(0, undefined, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input and trigger fetch
  useEffect(() => {
    if (!hasInitialized.current) return; // Skip until initial load is done
    
    const timer = setTimeout(() => {
      // Convert empty string to undefined so API returns all users
      const searchValue = searchQuery.trim() || undefined;
      setDebouncedSearch(searchValue);
      setPage(0); // Reset to first page on new search
      setData([]); // Clear existing data
      setHasMore(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch when debounced search changes (after initial load)
  useEffect(() => {
    if (!hasInitialized.current) return; // Skip initial mount
    
    fetchUsers(0, debouncedSearch, false);
  }, [debouncedSearch, fetchUsers]);

  // Load more when page changes
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, debouncedSearch, true);
    }
  }, [page, hasMore, loadingMore, loading, debouncedSearch, fetchUsers]);

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
          {debouncedSearch && debouncedSearch.trim() ? 'No users found' : 'No users available'}
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
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={Colors[colorScheme].muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <FlashList
        data={data}
        renderItem={renderUserRow}
        estimatedItemSize={70}
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
