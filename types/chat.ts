// types/chat.ts
// Data architecture for Community & Chat features
// Matches backend Java models: CommunityMessage.java and CommunityMessageDTO.java

export type MessageType =
  | 'text'
  | 'image'
  | 'system'
  | 'match_bid';

/**
 * Backend DTO structure (sent over WebSocket and REST API)
 * Matches: CommunityMessageDTO.java
 */
export interface CommunityMessageDTO {
  id?: number; // Message ID (for REST API and WebSocket responses)
  content: string;
  senderUsername: string;
  senderEmail?: string; // Email for identity verification
  sentAt?: string; // ISO date string
  senderId?: number; // Sender user ID
  isDeleted?: boolean; // Whether the message has been deleted
  deletedBy?: string; // Who deleted the message (username, "Admin", or "Moderator")
}

/**
 * Backend Entity structure (returned by REST API for message history)
 * Matches: CommunityMessage.java
 */
export interface CommunityMessage {
  id: number; // Long in Java -> number in TypeScript
  content: string;
  sentAt: string; // LocalDateTime in Java -> ISO date string in JSON
  senderId?: number; // If sender is serialized as ID only
  senderUsername?: string; // If sender is serialized with username
  communityId?: number; // If community is serialized as ID only
}

export interface User {
  id: string;
  name: string;
  avatar: string; // URL
}

/**
 * Specific data for the custom "Bid" widget seen in the chat screenshot
 */
export interface MatchBidData {
  league: string;       // e.g. "Serie A"
  leagueLogo?: string;  // URL for league logo
  country: string;      // e.g. "Italy"
  homeTeam: string;     // e.g. "PSG"
  awayTeam: string;     // e.g. "Lorient"
  matchTime: string;    // e.g. "02:00 PM"
  homeLogo: string;     // URL
  awayLogo: string;     // URL
}

/**
 * Frontend UI Message format (used by chat components)
 * This is a transformed version of CommunityMessage/CommunityMessageDTO
 * for easier UI rendering
 */
export interface Message {
  _id: string; // Frontend-generated or mapped from backend id
  text: string; // Mapped from content
  createdAt: Date | number; // Mapped from sentAt
  user: User; // Mapped from senderUsername/senderId
  senderEmail?: string; // Email for identity verification
  messageType: MessageType;
  isDeleted?: boolean; // Whether the message has been deleted
  deletedBy?: string; // Who deleted the message (username, "Admin", or "Moderator")
  /**
   * Snapshot of the parent message (for UI performance)
   */
  replyTo?: {
    id: string;
    originalText: string;
    senderName: string;
  };
  /**
   * Payload for custom cards (e.g. match bid)
   */
  customData?: MatchBidData;
}

export interface Community {
  id: string;
  name: string;
  lastMessage: string;       // For the list view
  lastMessageTime: string;
  logo: string;
  unreadCount?: number;
  memberCount?: string;      // e.g. "1.8M members"
  inviteCode?: string;       // QR code invitation code
}

/**
 * Moderator/Admin user with role
 */
export interface Moderator {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Moderator';
}

/**
 * Community member with points and roles
 */
export interface Member {
  id: string;
  name: string;
  avatar: string;
  points: number;
  joinedAt?: Date;
  roles?: string[]; // Community roles: 'OWNER', 'MODERATOR', 'MEMBER'
  email?: string; // For identification
}

/**
 * Leaderboard entry with rank
 */
export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  points: number;
}

/**
 * Full community info for the info screen
 */
export interface CommunityInfo {
  id: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  memberCount: string;
  moderators: Moderator[];
  rules: string[];
  members: Member[];
  leaderboard: LeaderboardEntry[];
  inviteCode?: string;       // QR code invitation code
}

