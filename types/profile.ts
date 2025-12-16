// types/profile.ts
// Data architecture for Profile features
// Structured for future backend integration

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
  location: string;
  bio: string;
  email: string;
  joinedAt?: Date;
}

export interface FavoriteTeam {
  id: string;
  name: string;
  logo?: string;
}

export interface UserCommunity {
  id: string;
  name: string;
  memberCount: string;
  rank: number;
  points: number;
  logo?: string;
}

export interface PredictionStats {
  total: number;
  correct: number;
  incorrect: number;
}

export interface ProfileData {
  user: UserProfile;
  favoriteTeams: FavoriteTeam[];
  communities: UserCommunity[];
  predictions: PredictionStats;
}

