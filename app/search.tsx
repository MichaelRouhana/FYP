import {
    FilterType,
    searchData,
    SearchResultItem,
} from '@/mock/searchData';
import { useTheme } from '@/context/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'teams', label: 'TEAMS' },
  { id: 'players', label: 'PLAYERS' },
  { id: 'competition', label: 'COMPETITION' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  // Track favorites locally - initialize empty, user controls all favorites
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());

  // Search results based on query and filter
  const searchResults = useMemo(() => {
    return searchData(searchQuery, activeFilter);
  }, [searchQuery, activeFilter]);

  // Toggle favorite (visual only for now)
  const toggleFavorite = useCallback((id: string | number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Check if item is favorited - only check local state
  const isFavorited = useCallback(
    (id: string | number) => {
      return favorites.has(id);
    },
    [favorites]
  );

  // Get placeholder text based on type
  const getPlaceholderText = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'team':
        return 'T';
      case 'player':
        return 'P';
      case 'league':
        return 'L';
      default:
        return '?';
    }
  };

  // Handle item press - navigate based on type
  const handleItemPress = useCallback((item: SearchResultItem) => {
    if (item.type === 'player') {
      router.push(`/player/${item.id}`);
    }
    // Team and league navigation can be added later
  }, []);

  // Render search result item
  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const isCircular = item.type === 'team' || item.type === 'player';
    const favorited = isFavorited(item.id);

    return (
      <TouchableOpacity 
        style={[styles.resultCard, { 
          backgroundColor: isDark ? '#111828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: theme.colors.border
        }]} 
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
      >
        {/* Image/Logo */}
        <View style={[styles.resultImage, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }, isCircular && styles.resultImageCircular]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.resultImageInner, isCircular && styles.resultImageCircular]}
              resizeMode={isCircular ? 'cover' : 'contain'}
            />
          ) : (
            <Text style={[styles.resultImagePlaceholder, { color: isDark ? '#ffffff' : '#18223A' }]}>
              {getPlaceholderText(item.type)}
            </Text>
          )}
        </View>

        {/* Title & Subtitle */}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
        </View>

        {/* Favorite Star */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name={favorited ? 'star' : 'star-outline'}
            size={24}
            color={favorited ? theme.colors.primary : theme.colors.iconMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      {/* Header with Back Button and Search Bar */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Feather name="chevron-left" size={28} color={theme.colors.icon} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { 
          backgroundColor: isDark ? '#080C17' : '#FFFFFF',
          borderColor: theme.colors.border
        }]}>
          <Feather name="search" size={20} color={theme.colors.iconMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search"
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterWrapper, { backgroundColor: theme.colors.headerBackground }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                { 
                  backgroundColor: isDark ? '#0F172C' : (activeFilter === filter.id ? theme.colors.primary : '#FFFFFF'),
                  borderWidth: isDark ? 0 : (activeFilter === filter.id ? 0 : 1),
                  borderColor: theme.colors.border
                },
                activeFilter === filter.id && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: isDark ? '#202D4B' : (activeFilter === filter.id ? '#FFFFFF' : '#18223A') },
                  activeFilter === filter.id && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderResultItem}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No results found</Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
  },
  filterWrapper: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterTabActive: {
    // Active state handled inline
  },
  filterTabText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  filterTabTextActive: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resultImageCircular: {
    borderRadius: 24,
  },
  resultImageInner: {
    width: '100%',
    height: '100%',
  },
  resultImagePlaceholder: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  resultSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
  },
});

