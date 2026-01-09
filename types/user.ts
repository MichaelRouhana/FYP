// types/user.ts
// TypeScript types matching backend UserViewDTO structure

/**
 * User View DTO - matches backend UserViewDTO.java
 * Used for displaying user information in lists, leaderboards, etc.
 */
export interface UserViewDTO {
  id: number; // User ID (Long in backend, mapped to number)
  username: string;
  email: string;
  pfp?: string; // Profile picture URL
  totalPoints?: number; // User's balance/points (Long in backend)
  totalBets?: number; // Total number of bets (Long in backend)
  totalWins?: number; // Total number of won bets (Long in backend)
  winRate?: number; // Win rate percentage (0.0 to 100.0, Double in backend)
  about?: string; // User's bio/about section
  country?: string; // User's country from address (if available)
  roles?: string[]; // User roles (system roles, not community roles)
}

/**
 * Alias for backward compatibility
 */
export type User = UserViewDTO;

