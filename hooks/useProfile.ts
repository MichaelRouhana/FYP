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

      console.log('🌍 Profile API Response:', JSON.stringify(profileData, null, 2));
      console.log('🌍 Country from API:', profileData.country);

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
        about: profileData.about,
        bio: profileData.about, // Map about to bio for backward compatibility
        country: profileData.country,
        location: profileData.country, // Map country to location for display
        roles: profileData.roles || [], // Include roles for admin check
      };

      console.log('🌍 Mapped user country:', mappedUser.country);

      setUser(mappedUser);

      // Map betting stats to predictions
      // Use totalLost from backend (excludes pending bets) instead of calculating totalBets - totalWins
      const totalBets = profileData.totalBets || 0;
      const totalWins = profileData.totalWins || 0;
      const totalLost = profileData.totalLost || 0; // Only lost bets, excludes pending
      setPredictions({
        total: totalBets,
        correct: totalWins,
        incorrect: totalLost, // Use totalLost instead of totalBets - totalWins to exclude pending
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
    fetchProfile, // Expose fetchProfile for manual refresh
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

