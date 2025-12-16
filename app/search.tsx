import {
    FilterType,
    searchData,
    SearchResultItem,
} from '@/mock/searchData';
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

  // Render search result item
  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const isCircular = item.type === 'team' || item.type === 'player';
    const favorited = isFavorited(item.id);

    return (
      <TouchableOpacity style={styles.resultCard} activeOpacity={0.7}>
        {/* Image/Logo */}
        <View style={[styles.resultImage, isCircular && styles.resultImageCircular]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.resultImageInner, isCircular && styles.resultImageCircular]}
              resizeMode={isCircular ? 'cover' : 'contain'}
            />
          ) : (
            <Text style={styles.resultImagePlaceholder}>
              {getPlaceholderText(item.type)}
            </Text>
          )}
        </View>

        {/* Title & Subtitle */}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
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
            color="#334369"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button and Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Feather name="chevron-left" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#1C263F" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#1C263F"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
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
                activeFilter === filter.id && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
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
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C17',
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
    backgroundColor: '#080C17',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#1C263F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
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
    backgroundColor: '#0F172C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: '#32A95D',
  },
  filterTabText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#202D4B',
  },
  filterTabTextActive: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111828',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  resultImage: {
    width: 48,
    height: 48,
    backgroundColor: '#1f2937',
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
    color: '#ffffff',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  resultSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#667085',
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
    color: '#667085',
  },
});

