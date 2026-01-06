// types/profile.ts
// Data architecture for Profile features
// Matches backend UserViewDTO structure

export interface UserProfile {
  id?: string; // Optional, may not be in DTO
  name?: string; // Optional, derived from username
  username: string;
  avatar?: string; // Mapped from pfp
  pfp?: string; // Direct from backend
  points: number; // Mapped from totalPoints
  totalPoints?: number; // Direct from backend
  location?: string; // Optional, mapped from country
  country?: string; // Direct from backend
  bio?: string; // Optional, mapped from about
  about?: string; // Direct from backend
  email: string;
  joinedAt?: Date; // Optional, not in backend DTO
  // Betting statistics from backend
  totalBets?: number;
  totalWins?: number;
  winRate?: number; // Percentage (0-100)
  // Roles for admin access
  roles?: string[]; // Array of role names (e.g., ["USER", "ADMIN"])
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
  total: number; // Mapped from totalBets
  correct: number; // Mapped from totalWins
  incorrect: number; // Calculated as total - correct
}

export interface ProfileData {
  user: UserProfile;
  favoriteTeams: FavoriteTeam[];
  communities: UserCommunity[];
  predictions: PredictionStats;
}

