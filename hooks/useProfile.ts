// hooks/useProfile.ts
// Mock data hook for Profile features
// Structured for future backend integration

import { useMemo } from 'react';
import { ProfileData, UserProfile, FavoriteTeam, UserCommunity, PredictionStats } from '@/types/profile';

// Mock user profile
const MOCK_USER: UserProfile = {
  id: 'user-1',
  name: 'Alex Morgan',
  username: '@alexm',
  avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=38bdf8&color=fff',
  points: 1250,
  location: 'United Kingdom',
  bio: 'Football enthusiast and prediction expert. Love analyzing matches and supporting my favorite teams!',
  email: 'alex_morgan@outlook.com',
  joinedAt: new Date('2023-06-15'),
};

// Mock favorite teams
const MOCK_FAVORITE_TEAMS: FavoriteTeam[] = [
  {
    id: 'team-psg',
    name: 'PSG',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  },
];

// Mock user communities
const MOCK_USER_COMMUNITIES: UserCommunity[] = [
  {
    id: 'psg-community',
    name: 'PSG',
    memberCount: '1.8M members',
    rank: 15,
    points: 1250,
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  },
];

// Mock prediction stats
const MOCK_PREDICTIONS: PredictionStats = {
  total: 156,
  correct: 106,
  incorrect: 50,
};

// Full mock profile data
const MOCK_PROFILE_DATA: ProfileData = {
  user: MOCK_USER,
  favoriteTeams: MOCK_FAVORITE_TEAMS,
  communities: MOCK_USER_COMMUNITIES,
  predictions: MOCK_PREDICTIONS,
};

/**
 * Hook to get the current user's profile data
 */
export function useProfile() {
  const profileData = useMemo(() => MOCK_PROFILE_DATA, []);

  return {
    profileData,
    user: profileData.user,
    favoriteTeams: profileData.favoriteTeams,
    communities: profileData.communities,
    predictions: profileData.predictions,
    loading: false,
    error: null,
  };
}

/**
 * Hook to get prediction stats
 */
export function usePredictionStats() {
  return {
    stats: MOCK_PREDICTIONS,
    loading: false,
    error: null,
  };
}

export { MOCK_PROFILE_DATA, MOCK_USER, MOCK_FAVORITE_TEAMS, MOCK_USER_COMMUNITIES, MOCK_PREDICTIONS };

