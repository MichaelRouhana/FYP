// hooks/useFavorites.ts
// Hook to access the global Favorites Context

import { useFavoritesContext } from '@/context/FavoritesContext';

// Re-export types for backward compatibility
export type FavoriteType = 'match' | 'player' | 'team' | 'competition';
export interface FavoriteItem {
  id: string | number;
  [key: string]: any;
}

/**
 * Hook to access favorites from the global Context
 * This ensures all components share the same state
 */
export function useFavorites() {
  const context = useFavoritesContext();
  
  // Map the context to match the old API for backward compatibility
  return {
    favorites: {
      matches: context.matches,
      players: context.players,
      teams: context.teams,
      competitions: context.competitions,
    },
    loading: context.loading,
    addFavorite: context.addFavorite,
    removeFavorite: context.removeFavorite,
    isFavorite: context.isFavorite,
    toggleFavorite: context.toggleFavorite,
    getFavorites: context.getFavorites,
    // For backward compatibility with old type names
    refreshFavorites: async () => {
      // No-op, context handles loading automatically
    },
  };
}

