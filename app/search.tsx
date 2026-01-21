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
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [allResults, setAllResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const normalize = useCallback((text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }, []);

  const normalizeForApi = useCallback((text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }, []);

  const generateSearchVariations = useCallback((query: string): string[] => {
    const apiNormalized = normalizeForApi(query);
    const variations = new Set<string>();
    
    variations.add(query.toLowerCase().trim());
    variations.add(apiNormalized);
    
    const words = query.toLowerCase().trim().split(/[\s-]+/).filter(w => w.length > 0);
    
    if (words.length > 0 && words[0].length > 2) {
      variations.add(words[0]);
    }
    
    const commonReplacements: { [key: string]: string } = {
      'christiano': 'cristiano',
      'cristiano': 'cristiano',
      'ronaldo': 'ronaldo',
      'messi': 'messi',
      'mbappe': 'mbappe',
    };
    
    let correctedQuery = apiNormalized;
    Object.keys(commonReplacements).forEach(misspelling => {
      if (correctedQuery.includes(misspelling)) {
        correctedQuery = correctedQuery.replace(misspelling, commonReplacements[misspelling]);
      }
    });
    if (correctedQuery !== apiNormalized) {
      variations.add(correctedQuery);
    }
    
    words.filter(w => w.length > 2).forEach(word => {
      variations.add(word);
    });
    
    return Array.from(variations);
  }, [normalizeForApi]);

  const performGlobalSearch = useCallback(async () => {
    setLoading(true);
    try {
      const originalQuery = searchQuery.trim();
      const normalizedQuery = normalize(searchQuery);
      const apiQuery = normalizeForApi(searchQuery);
      
      const originalWords = originalQuery.split(/[\s-]+/).filter(w => w.length > 0);
      const firstWord = originalWords.length > 0 ? originalWords[0] : originalQuery;
      const wordCount = originalWords.length;
      
      const encodedFirstWord = encodeURIComponent(firstWord.toLowerCase());
      const encodedFullQuery = encodeURIComponent(apiQuery);
      const encodedOriginalQuery = encodeURIComponent(originalQuery);
      
      const useFullQueryFirst = wordCount <= 2 && apiQuery.length <= 20;
      
      const basePromises = [
        api.get(`/football/teams?search=${encodedOriginalQuery}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on teams (original query)');
          }
          throw err;
        }),
        api.get(`/football/leagues?search=${encodedOriginalQuery}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on leagues (original query)');
          }
          throw err;
        }),
      ];
      
      const normalizedPromises = apiQuery !== originalQuery.toLowerCase() ? [
        api.get(`/football/teams?search=${encodedFullQuery}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on teams (normalized query)');
          }
          throw err;
        }),
        api.get(`/football/leagues?search=${encodedFullQuery}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on leagues (normalized query)');
          }
          throw err;
        }),
      ] : [];
      
      const firstWordPromises = wordCount > 1 && firstWord.toLowerCase() !== originalQuery.toLowerCase() ? [
        api.get(`/football/teams?search=${encodedFirstWord}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on teams (first word)');
          }
          throw err;
        }),
        api.get(`/football/leagues?search=${encodedFirstWord}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on leagues (first word)');
          }
          throw err;
        }),
      ] : [];
      
      const secondWordPromises = (() => {
        if ((originalQuery.toLowerCase().startsWith('al-') || originalQuery.toLowerCase().startsWith('al ')) && originalWords.length > 1) {
          const secondWord = originalWords[1];
          if (secondWord && secondWord.length >= 2) {
            const promises = [];
            
            promises.push(
              api.get(`/football/teams?search=${encodeURIComponent(secondWord)}`).catch((err) => {
                if (err.response?.status === 429) {
                  console.warn('[Search] Rate limited on teams (second word)');
                }
                throw err;
              }),
              api.get(`/football/leagues?search=${encodeURIComponent(secondWord)}`).catch((err) => {
                if (err.response?.status === 429) {
                  console.warn('[Search] Rate limited on leagues (second word)');
                }
                throw err;
              })
            );
            
            if (secondWord.length === 2 && secondWord.toLowerCase() === 'na') {
              promises.push(
                api.get(`/football/teams?search=${encodeURIComponent('nas')}`).catch((err) => {
                  if (err.response?.status === 429) {
                    console.warn('[Search] Rate limited on teams (nas fallback)');
                  }
                  throw err;
                }),
                api.get(`/football/leagues?search=${encodeURIComponent('nas')}`).catch((err) => {
                  if (err.response?.status === 429) {
                    console.warn('[Search] Rate limited on leagues (nas fallback)');
                  }
                  throw err;
                })
              );
            }
            
            return promises;
          }
        }
        return [];
      })();
      
      const allPromises = [
        ...basePromises,
        ...normalizedPromises,
        ...firstWordPromises,
        ...secondWordPromises,
      ];
      
      const playerPromises = [
        api.get(`/football/players?search=${encodedOriginalQuery}`).catch((err) => {
          if (err.response?.status === 429) {
            console.warn('[Search] Rate limited on players (original query)');
          }
          throw err;
        }),
        ...(wordCount > 1 && firstWord.toLowerCase() !== originalQuery.toLowerCase() ? [
          api.get(`/football/players?search=${encodedFirstWord}`).catch((err) => {
            if (err.response?.status === 429) {
              console.warn('[Search] Rate limited on players (first word)');
            }
            throw err;
          }),
        ] : []),
        ...(originalQuery.length >= 3 ? [
          api.get(`/football/players?search=${encodedOriginalQuery}&league=39&season=2024`).catch((err) => {
            if (err.response?.status === 429) {
              console.warn('[Search] Rate limited on players (Premier League)');
            }
            throw err;
          }),
          api.get(`/football/players?search=${encodedOriginalQuery}&league=140&season=2024`).catch((err) => {
            if (err.response?.status === 429) {
              console.warn('[Search] Rate limited on players (La Liga)');
            }
            throw err;
          }),
          api.get(`/football/players?search=${encodedOriginalQuery}&league=307&season=2024`).catch((err) => {
            if (err.response?.status === 429) {
              console.warn('[Search] Rate limited on players (Saudi Pro League)');
            }
            throw err;
          }),
          api.get(`/football/players?search=${encodedOriginalQuery}&league=135&season=2024`).catch((err) => {
            if (err.response?.status === 429) {
              console.warn('[Search] Rate limited on players (Serie A)');
            }
            throw err;
          }),
        ] : []),
      ];
      
      const allResults = await Promise.allSettled([
        ...allPromises,
        ...playerPromises,
      ]);
      
      let resultIndex = 0;
      
      const getResult = (): PromiseSettledResult<any> | null => {
        if (resultIndex < allResults.length) {
          const result = allResults[resultIndex++];
          if (result.status === 'rejected' && result.reason?.response?.status === 429) {
            return null;
          }
          return result;
        }
        return null;
      };
      
      const teamsRes = getResult();
      const leaguesRes = getResult();
      
      const hasNormalized = apiQuery !== originalQuery.toLowerCase();
      const teamsResFull = hasNormalized ? getResult() : null;
      const leaguesResFull = hasNormalized ? getResult() : null;
      
      const hasFirstWord = wordCount > 1 && firstWord.toLowerCase() !== originalQuery.toLowerCase();
      const teamsResFirstWord = hasFirstWord ? getResult() : null;
      const leaguesResFirstWord = hasFirstWord ? getResult() : null;
      
      const hasSecondWord = (originalQuery.toLowerCase().startsWith('al-') || originalQuery.toLowerCase().startsWith('al ')) && originalWords.length > 1 && originalWords[1].length >= 2;
      const teamsResSecondWord = hasSecondWord ? getResult() : null;
      const leaguesResSecondWord = hasSecondWord ? getResult() : null;
      const hasNasFallback = hasSecondWord && originalWords[1].toLowerCase() === 'na';
      const teamsResNasFallback = hasNasFallback ? getResult() : null;
      const leaguesResNasFallback = hasNasFallback ? getResult() : null;
      
      const playerResArray = allResults.slice(resultIndex).filter(r => {
        if (r.status === 'rejected' && r.reason?.response?.status === 429) {
          return false;
        }
        return true;
      });

      const newResults: SearchResultItem[] = [];
      const seenIds = new Set<string>();

      const addResult = (result: SearchResultItem) => {
        const key = `${result.type}-${result.id}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          newResults.push(result);
        }
      };

      const processTeamResults = (result: PromiseSettledResult<any> | null) => {
        if (result && result.status === 'fulfilled' && result.value?.data?.response) {
          const teamsData = (result.value.data.response as ApiTeam[]) || [];
          teamsData.forEach((item) => {
          if (item?.team?.id && item?.team?.name) {
              const teamName = String(item.team.name).trim();
              addResult({
              id: item.team.id,
                title: teamName,
              subtitle: 'Team',
              imageUrl: item.team.logo,
              type: 'team',
            });
          }
        });
      }
      };
      
      if (teamsRes) processTeamResults(teamsRes);
      if (teamsResFull) processTeamResults(teamsResFull);
      if (teamsResFirstWord) processTeamResults(teamsResFirstWord);
      if (teamsResSecondWord) processTeamResults(teamsResSecondWord);
      if (teamsResNasFallback) processTeamResults(teamsResNasFallback);

      const processLeagueResults = (result: PromiseSettledResult<any> | null) => {
        if (result && result.status === 'fulfilled' && result.value?.data?.response) {
          const leaguesData = (result.value.data.response as ApiLeague[]) || [];
        leaguesData.forEach((item) => {
          if (item?.league?.id && item?.league?.name) {
              const leagueName = String(item.league.name).trim();
              addResult({
              id: item.league.id,
                title: leagueName,
                subtitle: (item.league.country || '').trim(),
              imageUrl: item.league.logo,
              type: 'league',
            });
          }
        });
        }
      };
      
      if (leaguesRes) processLeagueResults(leaguesRes);
      if (leaguesResFull) processLeagueResults(leaguesResFull);
      if (leaguesResFirstWord) processLeagueResults(leaguesResFirstWord);
      if (leaguesResSecondWord) processLeagueResults(leaguesResSecondWord);
      if (leaguesResNasFallback) processLeagueResults(leaguesResNasFallback);

      playerResArray.forEach((playerRes, index) => {
        if (playerRes.status === 'fulfilled') {
          const responseData = playerRes.value?.data;
          if (!responseData) {
            return;
          }
          
          const playersData = (responseData.response as ApiPlayer[]) || [];
          playersData.forEach((item) => {
            if (item?.player?.id && item?.player?.name) {
              const playerName = String(item.player.name).trim();
              addResult({
                id: item.player.id,
                title: playerName,
                subtitle: 'Player',
                imageUrl: item.player.photo,
                type: 'player',
              });
            }
          });
        }
      });

      setAllResults(newResults);

    } catch (error: any) {
      console.error('Global search error:', error);
      
      if (error?.response?.status === 429) {
        console.warn('[Search] Rate limit reached. Please wait a moment before searching again.');
      } else {
        setAllResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, normalizeForApi, normalize]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        performGlobalSearch();
      } else {
        setAllResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performGlobalSearch]);

  const fuzzyMatch = useCallback((item: SearchResultItem, query: string): boolean => {
    if (!query || query.trim().length === 0) return true;
    
    if (!item || (!item.title && !item.subtitle)) return false;
    
    const normalizedQuery = normalize(query);
    
    if (normalizedQuery.length === 0) return true;
    
    const itemName = normalize(item.title || '');
    const itemSubtitle = normalize(item.subtitle || '');
    const combinedText = `${itemName}${itemSubtitle}`;
    
    if (combinedText.length === 0) return false;
    
    const matches = combinedText.includes(normalizedQuery);
    
    return matches;
  }, [normalize]);

  const filteredResults = useMemo(() => {
    if (allResults.length === 0) {
      return [];
    }

    let results = allResults.filter(item => 
      item && 
      item.id !== undefined && 
      item.id !== null && 
      (item.title || item.subtitle)
    );

    if (searchQuery && searchQuery.trim().length > 0) {
      const beforeCount = results.length;
      results = results.filter(item => {
        const matches = fuzzyMatch(item, searchQuery);
        return matches;
      });
    }

    if (activeFilter === 'all') return results;

    if (activeFilter === 'teams') return results.filter(r => r.type === 'team');
    if (activeFilter === 'players') return results.filter(r => r.type === 'player');
    if (activeFilter === 'competition') return results.filter(r => r.type === 'league');
    
    return [];
  }, [allResults, activeFilter, searchQuery, fuzzyMatch]);

  const handleItemPress = async (item: SearchResultItem) => {
    await addToHistory(item.title);
    
    if (item.type === 'player') {
      router.push(`/player/${item.id}`);
    } else if (item.type === 'team') {
      router.push(`/team/${item.id}`);
    } else if (item.type === 'league') {
      router.push(`/competition/${item.id}`);
    }
  };

  const handleRecentSearchPress = (term: string) => {
    setSearchQuery(term);
  };

  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const isCircular = item.type === 'team' || item.type === 'player';
    const favoriteType = item.type === 'league' ? 'competition' : item.type;
    const favorited = isFavorite(favoriteType, typeof item.id === 'string' ? parseInt(item.id) : item.id);

    const handleToggleFavorite = () => {
      toggleFavorite(favoriteType, {
        id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
        name: item.title,
        imageUrl: item.imageUrl || '',
        type: favoriteType,
      });
    };

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

        <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
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

      {searchQuery.length === 0 ? (
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
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}-${item.id}`}
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