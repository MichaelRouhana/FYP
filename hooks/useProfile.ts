// hooks/useProfile.ts
// Real data hook for Profile features
// Fetches from backend API

import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import { ProfileData, UserProfile, FavoriteTeam, UserCommunity, PredictionStats } from '@/types/profile';

/**
 * Hook to get the current user's profile data from backend
 */
export function useProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [predictions, setPredictions] = useState<PredictionStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile from backend
      const response = await api.get('/users/profile');
      const profileData = response.data;

      // Map backend UserViewDTO to frontend UserProfile
      const mappedUser: UserProfile = {
        username: profileData.username || '',
        email: profileData.email || '',
        pfp: profileData.pfp,
        avatar: profileData.pfp || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username || 'User')}&background=38bdf8&color=fff`,
        name: profileData.username || 'User', // Use username as name
        points: profileData.totalPoints || 0,
        totalPoints: profileData.totalPoints,
        totalBets: profileData.totalBets,
        totalWins: profileData.totalWins,
        winRate: profileData.winRate,
      };

      setUser(mappedUser);

      // Map betting stats to predictions
      const totalBets = profileData.totalBets || 0;
      const totalWins = profileData.totalWins || 0;
      setPredictions({
        total: totalBets,
        correct: totalWins,
        incorrect: totalBets - totalWins,
      });

      // TODO: Fetch favorite teams and communities from separate endpoints if available
      // For now, keep empty arrays
      setFavoriteTeams([]);
      setCommunities([]);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const profileData: ProfileData | null = user ? {
    user,
    favoriteTeams,
    communities,
    predictions,
  } : null;

  return {
    profileData,
    user: user || {
      username: '',
      email: '',
      points: 0,
      avatar: '',
    },
    favoriteTeams,
    communities,
    predictions,
    loading,
    error,
  };
}

/**
 * Hook to get prediction stats
 */
export function usePredictionStats() {
  const { predictions, loading, error } = useProfile();
  return {
    stats: predictions,
    loading,
    error,
  };
}

