import { useTheme } from '@/context/ThemeContext';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useFavorites } from '@/hooks/useFavorites';
import api from '@/services/api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

// --- Types ---
type ApiTeam = { team: { id: number; name: string; logo: string } };
type ApiLeague = { league: { id: number; name: string; logo: string; country: string } };
type ApiPlayer = { player: { id: number; name: string; photo: string; firstname: string; lastname: string } };

type SearchResultItem = {
  id: string | number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  type: 'team' | 'player' | 'league';
};

type FilterType = 'all' | 'teams' | 'players' | 'competition';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'teams', label: 'TEAMS' },
  { id: 'players', label: 'PLAYERS' },
  { id: 'competition', label: 'LEAGUES' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();
  const { isFavorite, toggleFavorite: toggleGlobalFavorite } = useFavorites();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all'); // Default is ALL
  
  // Data State
  const [allResults, setAllResults] = useState<SearchResultItem[]>([]); // Stores everything fetched
  const [loading, setLoading] = useState(false);

  // --- 1. Fuzzy Search Helper Functions (defined early) ---
  const normalize = useCallback((text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  }, []);

  // --- 2. Debounced Search Effect ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        performGlobalSearch();
      } else {
        setAllResults([]);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); // Only re-run if query changes (not filter)

  // --- 3. Fetch Logic (Fetches ALL types at once) ---
  const performGlobalSearch = async () => {
    setLoading(true);
    try {
      // Strategy: Use first word for API call to get broader results
      // The external API may not handle multi-word queries well
      // We'll filter client-side with fuzzy matching to narrow down results
      const normalizedQuery = normalize(searchQuery);
      const searchTerms = normalizedQuery.split(' ').filter(t => t.length > 0);
      const apiSearchTerm = searchTerms.length > 0 ? searchTerms[0] : searchQuery.trim();
      const encodedQuery = encodeURIComponent(apiSearchTerm);
      
      console.log(`[Search] API query: "${apiSearchTerm}" (from "${searchQuery}")`);
      
      // We run 3 requests in parallel to populate the "ALL" view
      const [teamsRes, leaguesRes, playersRes] = await Promise.allSettled([
        api.get(`/football/teams?search=${encodedQuery}`),
        api.get(`/football/leagues?search=${encodedQuery}`),
        // Note: Players search usually requires league/season context in API-Sports. 
        // We default to PL 2023 to ensure *some* results appear. 
        // If your plan allows global player search, remove the extra params.
        api.get(`/football/players?search=${encodedQuery}&league=39&season=2023`) 
      ]);

      const newResults: SearchResultItem[] = [];

      // Process Teams
      if (teamsRes.status === 'fulfilled') {
        const teamsData = (teamsRes.value.data.response as ApiTeam[]) || [];
        teamsData.forEach((item) => {
          newResults.push({
            id: item.team.id,
            title: item.team.name,
            subtitle: 'Team',
            imageUrl: item.team.logo,
            type: 'team',
          });
        });
      }

      // Process Leagues
      if (leaguesRes.status === 'fulfilled') {
        const leaguesData = (leaguesRes.value.data.response as ApiLeague[]) || [];
        leaguesData.forEach((item) => {
          newResults.push({
            id: item.league.id,
            title: item.league.name,
            subtitle: item.league.country,
            imageUrl: item.league.logo,
            type: 'league',
          });
        });
      }

      // Process Players
      if (playersRes.status === 'fulfilled') {
        const playersData = (playersRes.value.data.response as ApiPlayer[]) || [];
        playersData.forEach((item) => {
          newResults.push({
            id: item.player.id,
            title: item.player.name,
            subtitle: 'Player', // Simplified subtitle
            imageUrl: item.player.photo,
            type: 'player',
          });
        });
      }

      setAllResults(newResults);

    } catch (error) {
      console.error('Global search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Fuzzy Match Function ---
  const fuzzyMatch = useCallback((item: SearchResultItem, query: string): boolean => {
    if (!query || query.trim().length === 0) return true;
    
    const normalizedQuery = normalize(query);
    const searchTerms = normalizedQuery.split(' ').filter(t => t.length > 0);
    
    if (searchTerms.length === 0) return true;
    
    // Search in both title and subtitle
    const itemName = normalize(item.title);
    const itemSubtitle = normalize(item.subtitle);
    const combinedText = `${itemName} ${itemSubtitle}`;
    
    // Check if EVERY search term appears somewhere in the item name or subtitle
    return searchTerms.every(term => combinedText.includes(term));
  }, [normalize]);

  // --- 5. Filter Logic (Client Side) ---
  const filteredResults = useMemo(() => {
    let results = allResults;

    // First, apply fuzzy text filtering if there's a search query
    // This ensures multi-word queries like "Real Madrid" work correctly
    if (searchQuery && searchQuery.trim().length > 0) {
      results = results.filter(item => fuzzyMatch(item, searchQuery));
      console.log(`[Search] Filtered ${allResults.length} results to ${results.length} using query: "${searchQuery}"`);
    }

    // Then, apply type filter
    if (activeFilter === 'all') return results;

    if (activeFilter === 'teams') return results.filter(r => r.type === 'team');
    if (activeFilter === 'players') return results.filter(r => r.type === 'player');
    if (activeFilter === 'competition') return results.filter(r => r.type === 'league');
    
    return [];
  }, [allResults, activeFilter, searchQuery, fuzzyMatch]);

  // --- Helper Functions ---
  const handleToggleFavorite = useCallback((item: SearchResultItem) => {
    // Map search result item to favorite item structure
    const favoriteItem = {
      id: item.id,
      name: item.title,
      imageUrl: item.imageUrl,
      logo: item.imageUrl, // Also include logo for teams
      type: item.type,
    };
    
    // Determine favorite type based on item type
    let favoriteType: 'match' | 'player' | 'team' | 'competition' = 'team';
    if (item.type === 'player') favoriteType = 'player';
    else if (item.type === 'team') favoriteType = 'team';
    else if (item.type === 'league') favoriteType = 'competition';
    
    toggleGlobalFavorite(favoriteType, favoriteItem);
  }, [toggleGlobalFavorite]);

  const handleItemPress = async (item: SearchResultItem) => {
    // Add to search history before navigating
    await addToHistory(item.title);
    
    if (item.type === 'player') {
      router.push(`/player/${item.id}`);
    } else if (item.type === 'team') {
      router.push(`/team/${item.id}`);
    } else if (item.type === 'league') {
      // Handle league navigation if needed
      console.log('Navigate to league:', item.id);
    }
  };

  const handleRecentSearchPress = (term: string) => {
    setSearchQuery(term);
    // This will trigger the search via useEffect
  };

  // --- Render Item ---
  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const isCircular = item.type === 'team' || item.type === 'player';
    
    // Determine favorite type and check if favorited
    let favoriteType: 'match' | 'player' | 'team' | 'competition' = 'team';
    if (item.type === 'player') favoriteType = 'player';
    else if (item.type === 'team') favoriteType = 'team';
    else if (item.type === 'league') favoriteType = 'competition';
    
    const favorited = isFavorite(favoriteType, item.id);

    return (
      <TouchableOpacity
        style={[styles.resultCard, {
          backgroundColor: isDark ? '#111828' : '#FFFFFF',
          borderWidth: isDark ? 0 : 1,
          borderColor: theme.colors.border
        }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={[styles.resultImage, { backgroundColor: isDark ? '#1f2937' : '#E5E7EB' }, isCircular && styles.resultImageCircular]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.resultImageInner, isCircular && styles.resultImageCircular]}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: theme.colors.text }}>?</Text>
          )}
        </View>

        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
        </View>

        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFavorite(item);
          }} 
          style={styles.favoriteButton}
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color={theme.colors.icon} />
        </TouchableOpacity>

        <View style={[styles.searchBar, {
          backgroundColor: isDark ? '#080C17' : '#FFFFFF',
          borderColor: theme.colors.border
        }]}>
          <Feather name="search" size={20} color={theme.colors.iconMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search teams, players..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterWrapper, { backgroundColor: theme.colors.headerBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: activeFilter === filter.id ? theme.colors.primary : (isDark ? '#0F172C' : '#FFFFFF'),
                  borderColor: theme.colors.border,
                  borderWidth: activeFilter === filter.id ? 0 : 1
                }
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text style={[
                styles.filterTabText,
                { color: activeFilter === filter.id ? '#FFFFFF' : (isDark ? '#202D4B' : '#18223A') }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results or Recent Searches */}
      {searchQuery.length === 0 ? (
        // Show Recent Searches when search is empty
        <View style={styles.recentSearchesContainer}>
          {history.length > 0 && (
            <View style={styles.recentSearchesHeader}>
              <Text style={[styles.recentSearchesTitle, { color: theme.colors.text }]}>
                Recent Searches
              </Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={[styles.clearHistoryText, { color: theme.colors.primary }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <FlatList
            data={history}
            keyExtractor={(item, index) => `history-${index}-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recentSearchItem, {
                  backgroundColor: isDark ? '#111828' : '#FFFFFF',
                  borderColor: theme.colors.border,
                }]}
                onPress={() => handleRecentSearchPress(item)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.recentSearchIcon}
                />
                <Text style={[styles.recentSearchText, { color: theme.colors.text }]} numberOfLines={1}>
                  {item}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFromHistory(item)}
                  style={styles.recentSearchDelete}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.recentSearchesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                  No recent searches
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textMuted, marginTop: 8 }]}>
                  Start searching to see your history here
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        // Show Search Results when query exists
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}-${item.id}`} // Ensure unique key across types
          renderItem={renderResultItem}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            !loading && searchQuery.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No results found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { padding: 4 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 5, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Montserrat_500Medium' },
  filterWrapper: { paddingVertical: 12 },
  filterScrollContent: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  filterTabText: { fontSize: 13, fontFamily: 'Montserrat_700Bold' },
  resultsList: { paddingHorizontal: 16, paddingBottom: 20 },
  resultCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 5, padding: 12, marginBottom: 12, gap: 12 },
  resultImage: { width: 48, height: 48, borderRadius: 5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  resultImageCircular: { borderRadius: 24 },
  resultImageInner: { width: '100%', height: '100%' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  resultSubtitle: { fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 2 },
  favoriteButton: { padding: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Montserrat_500Medium' },
  emptySubtext: { fontSize: 13, fontFamily: 'Montserrat_400Regular', textAlign: 'center' },
  // Recent Searches
  recentSearchesContainer: { flex: 1, paddingHorizontal: 16 },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  clearHistoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
  },
  recentSearchesList: { paddingBottom: 20 },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  recentSearchIcon: {
    marginRight: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
  },
  recentSearchDelete: {
    padding: 4,
    marginLeft: 8,
  },
});