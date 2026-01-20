// context/FavoritesContext.tsx
// Global Context Provider for managing favorites across the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/utils/storage';
import { useProfile } from '@/hooks/useProfile';

export type FavoriteType = 'match' | 'player' | 'team' | 'competition';

export interface FavoriteItem {
  id: string | number;
  [key: string]: any; // Allow any additional properties
}

// Base storage keys (will be prefixed with username)
const BASE_STORAGE_KEYS = {
  match: 'fav_matches',
  player: 'fav_players',
  team: 'fav_teams',
  competition: 'fav_competitions',
} as const;

// Generate user-specific storage key
const getStorageKey = (type: FavoriteType, username: string | null): string => {
  const baseKey = BASE_STORAGE_KEYS[type];
  if (!username) {
    // Fallback to non-user-specific key if no username (shouldn't happen in normal flow)
    return baseKey;
  }
  return `${baseKey}_${username}`;
};

interface FavoritesContextType {
  matches: FavoriteItem[];
  players: FavoriteItem[];
  teams: FavoriteItem[];
  competitions: FavoriteItem[];
  loading: boolean;
  toggleFavorite: (type: FavoriteType, item: FavoriteItem) => Promise<void>;
  isFavorite: (type: FavoriteType, id: string | number) => boolean;
  addFavorite: (type: FavoriteType, item: FavoriteItem) => Promise<void>;
  removeFavorite: (type: FavoriteType, id: string | number) => Promise<void>;
  getFavorites: (type: FavoriteType) => FavoriteItem[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useProfile();
  const username = user?.username || null;
  
  const [matches, setMatches] = useState<FavoriteItem[]>([]);
  const [players, setPlayers] = useState<FavoriteItem[]>([]);
  const [teams, setTeams] = useState<FavoriteItem[]>([]);
  const [competitions, setCompetitions] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [matchesData, playersData, teamsData, competitionsData] = await Promise.all([
        getItem(getStorageKey('match', username)),
        getItem(getStorageKey('player', username)),
        getItem(getStorageKey('team', username)),
        getItem(getStorageKey('competition', username)),
      ]);

      setMatches(matchesData ? JSON.parse(matchesData) : []);
      setPlayers(playersData ? JSON.parse(playersData) : []);
      setTeams(teamsData ? JSON.parse(teamsData) : []);
      setCompetitions(competitionsData ? JSON.parse(competitionsData) : []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Load favorites from storage on mount and when username changes
  useEffect(() => {
    if (username) {
      loadFavorites();
    } else {
      // Clear favorites if no user is logged in
      setMatches([]);
      setPlayers([]);
      setTeams([]);
      setCompetitions([]);
      setLoading(false);
    }
  }, [username, loadFavorites]);

  const saveFavorites = useCallback(async (type: FavoriteType, items: FavoriteItem[]) => {
    if (!username) {
      console.warn('Cannot save favorites: no user logged in');
      return;
    }

    try {
      await setItem(getStorageKey(type, username), JSON.stringify(items));
      
      // Update state based on type using functional updates to ensure we have latest state
      switch (type) {
        case 'match':
          setMatches(items);
          break;
        case 'player':
          setPlayers(items);
          break;
        case 'team':
          setTeams(items);
          break;
        case 'competition':
          setCompetitions(items);
          break;
      }
    } catch (error) {
      console.error(`Error saving favorites for ${type}:`, error);
      throw error;
    }
  }, [username]);

  const getCurrentFavorites = useCallback((type: FavoriteType, currentState?: {
    matches: FavoriteItem[];
    players: FavoriteItem[];
    teams: FavoriteItem[];
    competitions: FavoriteItem[];
  }): FavoriteItem[] => {
    // Use provided state or fall back to current state
    const state = currentState || { matches, players, teams, competitions };
    switch (type) {
      case 'match':
        return state.matches;
      case 'player':
        return state.players;
      case 'team':
        return state.teams;
      case 'competition':
        return state.competitions;
      default:
        return [];
    }
  }, [matches, players, teams, competitions]);

  const addFavorite = useCallback(
    async (type: FavoriteType, item: FavoriteItem) => {
      if (!username) {
        console.warn('Cannot add favorite: no user logged in');
        return;
      }

      // Use functional state updates to get the latest state
      let currentFavorites: FavoriteItem[] = [];
      const storageKey = getStorageKey(type, username);
      
      switch (type) {
        case 'match':
          setMatches((prev) => {
            currentFavorites = prev;
            const itemId = String(item.id);
            // Check if already favorited
            if (prev.some((fav) => String(fav.id) === itemId)) {
              return prev; // Already favorited, return unchanged
            }
            // Add new favorite
            const updated = [...prev, item];
            // Save to storage asynchronously
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'player':
          setPlayers((prev) => {
            currentFavorites = prev;
            const itemId = String(item.id);
            if (prev.some((fav) => String(fav.id) === itemId)) {
              return prev;
            }
            const updated = [...prev, item];
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'team':
          setTeams((prev) => {
            currentFavorites = prev;
            const itemId = String(item.id);
            if (prev.some((fav) => String(fav.id) === itemId)) {
              return prev;
            }
            const updated = [...prev, item];
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'competition':
          setCompetitions((prev) => {
            currentFavorites = prev;
            const itemId = String(item.id);
            if (prev.some((fav) => String(fav.id) === itemId)) {
              return prev;
            }
            const updated = [...prev, item];
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
      }
    },
    [username]
  );

  const removeFavorite = useCallback(
    async (type: FavoriteType, id: string | number) => {
      if (!username) {
        console.warn('Cannot remove favorite: no user logged in');
        return;
      }

      const itemId = String(id);
      const storageKey = getStorageKey(type, username);
      
      // Use functional state updates to get the latest state
      switch (type) {
        case 'match':
          setMatches((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'player':
          setPlayers((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'team':
          setTeams((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'competition':
          setCompetitions((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(storageKey, JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
      }
    },
    [username]
  );

  const isFavorite = useCallback(
    (type: FavoriteType, id: string | number): boolean => {
      const currentFavorites = getCurrentFavorites(type);
      const itemId = String(id);
      return currentFavorites.some((fav) => String(fav.id) === itemId);
    },
    [getCurrentFavorites]
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
      return getCurrentFavorites(type);
    },
    [getCurrentFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        matches,
        players,
        teams,
        competitions,
        loading,
        toggleFavorite,
        isFavorite,
        addFavorite,
        removeFavorite,
        getFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}

