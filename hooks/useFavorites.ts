// hooks/useFavorites.ts
// Local storage hook for managing favorites (matches, players, teams, competitions)

import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/utils/storage';

export type FavoriteType = 'matches' | 'players' | 'teams' | 'competitions';

export interface FavoriteItem {
  id: string | number;
  [key: string]: any; // Allow any additional properties
}

const STORAGE_KEYS = {
  matches: 'fav_matches',
  players: 'fav_players',
  teams: 'fav_teams',
  competitions: 'fav_competitions',
} as const;

/**
 * Hook to manage favorites using local storage
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<{
    matches: FavoriteItem[];
    players: FavoriteItem[];
    teams: FavoriteItem[];
    competitions: FavoriteItem[];
  }>({
    matches: [],
    players: [],
    teams: [],
    competitions: [],
  });
  const [loading, setLoading] = useState(true);

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const [matches, players, teams, competitions] = await Promise.all([
        getItem(STORAGE_KEYS.matches),
        getItem(STORAGE_KEYS.players),
        getItem(STORAGE_KEYS.teams),
        getItem(STORAGE_KEYS.competitions),
      ]);

      setFavorites({
        matches: matches ? JSON.parse(matches) : [],
        players: players ? JSON.parse(players) : [],
        teams: teams ? JSON.parse(teams) : [],
        competitions: competitions ? JSON.parse(competitions) : [],
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFavorites = useCallback(async (type: FavoriteType, items: FavoriteItem[]) => {
    try {
      await setItem(STORAGE_KEYS[type], JSON.stringify(items));
      setFavorites((prev) => ({
        ...prev,
        [type]: items,
      }));
    } catch (error) {
      console.error(`Error saving favorites for ${type}:`, error);
      throw error;
    }
  }, []);

  const addFavorite = useCallback(
    async (type: FavoriteType, item: FavoriteItem) => {
      const currentFavorites = favorites[type];
      const itemId = String(item.id);

      // Check if already favorited
      if (currentFavorites.some((fav) => String(fav.id) === itemId)) {
        return; // Already favorited
      }

      const updated = [...currentFavorites, item];
      await saveFavorites(type, updated);
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    async (type: FavoriteType, id: string | number) => {
      const currentFavorites = favorites[type];
      const itemId = String(id);
      const updated = currentFavorites.filter((fav) => String(fav.id) !== itemId);
      await saveFavorites(type, updated);
    },
    [favorites, saveFavorites]
  );

  const isFavorite = useCallback(
    (type: FavoriteType, id: string | number): boolean => {
      const currentFavorites = favorites[type];
      const itemId = String(id);
      return currentFavorites.some((fav) => String(fav.id) === itemId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (type: FavoriteType, item: FavoriteItem) => {
      const itemId = String(item.id);
      if (isFavorite(type, itemId)) {
        await removeFavorite(type, itemId);
      } else {
        await addFavorite(type, item);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const getFavorites = useCallback(
    (type: FavoriteType): FavoriteItem[] => {
      return favorites[type] || [];
    },
    [favorites]
  );

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFavorites,
    refreshFavorites: loadFavorites,
  };
}

