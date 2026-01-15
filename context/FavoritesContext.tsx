// context/FavoritesContext.tsx
// Global Context Provider for managing favorites across the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/utils/storage';

export type FavoriteType = 'match' | 'player' | 'team' | 'competition';

export interface FavoriteItem {
  id: string | number;
  [key: string]: any; // Allow any additional properties
}

const STORAGE_KEYS = {
  match: 'fav_matches',
  player: 'fav_players',
  team: 'fav_teams',
  competition: 'fav_competitions',
} as const;

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
  const [matches, setMatches] = useState<FavoriteItem[]>([]);
  const [players, setPlayers] = useState<FavoriteItem[]>([]);
  const [teams, setTeams] = useState<FavoriteItem[]>([]);
  const [competitions, setCompetitions] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const [matchesData, playersData, teamsData, competitionsData] = await Promise.all([
        getItem(STORAGE_KEYS.match),
        getItem(STORAGE_KEYS.player),
        getItem(STORAGE_KEYS.team),
        getItem(STORAGE_KEYS.competition),
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
  }, []);

  const saveFavorites = useCallback(async (type: FavoriteType, items: FavoriteItem[]) => {
    try {
      await setItem(STORAGE_KEYS[type], JSON.stringify(items));
      
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
  }, []);

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
      // Use functional state updates to get the latest state
      let currentFavorites: FavoriteItem[] = [];
      
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
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
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
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
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
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
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
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
      }
    },
    []
  );

  const removeFavorite = useCallback(
    async (type: FavoriteType, id: string | number) => {
      const itemId = String(id);
      
      // Use functional state updates to get the latest state
      switch (type) {
        case 'match':
          setMatches((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'player':
          setPlayers((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'team':
          setTeams((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
        case 'competition':
          setCompetitions((prev) => {
            const updated = prev.filter((fav) => String(fav.id) !== itemId);
            setItem(STORAGE_KEYS[type], JSON.stringify(updated)).catch(console.error);
            return updated;
          });
          break;
      }
    },
    []
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

