// hooks/useSearchHistory.ts
// Hook to manage recent search history using AsyncStorage

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveHistory = useCallback(async (newHistory: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
      throw error;
    }
  }, []);

  const addToHistory = useCallback(
    async (term: string) => {
      if (!term || term.trim().length === 0) {
        return; // Don't add empty terms
      }

      const trimmedTerm = term.trim();
      
      // Use functional update to get latest history
      setHistory((prevHistory) => {
        // Remove the term if it already exists (to move it to the front)
        const filteredHistory = prevHistory.filter((item) => item.toLowerCase() !== trimmedTerm.toLowerCase());
        
        // Add the new term at the beginning
        const newHistory = [trimmedTerm, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
        
        // Save to storage asynchronously
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory)).catch(console.error);
        
        return newHistory;
      });
    },
    []
  );

  const removeFromHistory = useCallback(
    async (term: string) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.filter((item) => item !== term);
        // Save to storage asynchronously
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory)).catch(console.error);
        return newHistory;
      });
    },
    []
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }, []);

  return {
    history,
    loading,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory: loadHistory,
  };
}

