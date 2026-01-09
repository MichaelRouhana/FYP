// services/communityApi.ts
// API service for Community operations

import api from './api';

export interface CommunityRequestDTO {
  name: string;
  shortDescription?: string;
  description: string;
  isPrivate?: boolean;
  // Legacy fields for backward compatibility
  logo?: string;
  location?: string;
  about?: string;
  rules?: string[];
}

export interface UserViewDTO {
  id?: number;
  username: string;
  email: string;
  pfp?: string;
  roles?: string[]; // Community roles: 'OWNER', 'MODERATOR', 'MEMBER'
  totalPoints?: number;
  about?: string;
  country?: string;
}

export interface CommunityResponseDTO {
  id: number;
  name: string;
  logo?: string;
  location?: string;
  about?: string;
  rules?: string[];
  inviteCode?: string;
  userIds?: number[];
  moderators?: UserViewDTO[]; // Real moderators from backend
  leaderboard?: UserViewDTO[]; // Top 3 leaderboard
}

/**
 * Create a new community (Admin only)
 * POST /api/v1/communities
 * Accepts multipart/form-data with community data and optional image file
 * 
 * Backend expects:
 * - @RequestPart("data") String data - JSON string
 * - @RequestPart(value = "file", required = false) MultipartFile file - optional file
 */
export async function createCommunity(
  data: CommunityRequestDTO,
  imageUri: string | null = null
): Promise<CommunityResponseDTO> {
  try {
    const formData = new FormData();
    
    // Append the JSON data as a string (backend expects @RequestPart("data") String)
    formData.append('data', JSON.stringify(data));
    
    // Append the image file if provided (backend expects @RequestPart("file") MultipartFile)
    if (imageUri) {
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'upload.jpg';
      
      // Extract file extension and determine MIME type
      // Handle common image extensions
      const match = /\.(\w+)$/.exec(filename);
      let type = 'image/jpeg'; // Default
      if (match) {
        const ext = match[1].toLowerCase();
        // Map common extensions to MIME types
        const mimeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
        };
        type = mimeMap[ext] || `image/${ext}`;
      }
      
      // React Native FormData file format (exact format as specified)
      formData.append('file', {
        uri: imageUri,
        name: filename || 'upload.jpg',
        type: type,
      } as any);
    }
    
    // DO NOT set Content-Type header manually - Axios will set it automatically
    // with the correct boundary for multipart/form-data
    // The interceptor in api.ts already handles deleting Content-Type for FormData
    const response = await api.post<CommunityResponseDTO>('/communities', formData);
    
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error creating community:', error);
    console.error('[communityApi] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Get community details by ID
 * GET /api/v1/communities/{id}
 * Returns full CommunityResponseDTO including inviteCode
 */
export async function getCommunityById(id: number | string): Promise<CommunityResponseDTO> {
  try {
    const response = await api.get<CommunityResponseDTO>(`/communities/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error fetching community:', error);
    throw error;
  }
}

/**
 * Join a community by invite code
 * POST /api/v1/communities/join
 * Accepts invite code in request body using InvitationRequestDTO
 */
export async function joinCommunityByInviteCode(inviteCode: string): Promise<void> {
  try {
    await api.post('/communities/join', { inviteCode });
  } catch (error: any) {
    console.error('[communityApi] Error joining community by invite code:', error);
    throw error;
  }
}

/**
 * Promote a member to moderator
 * PUT /api/v1/communities/{communityId}/promote/{userId}
 * Only OWNER can promote members
 */
export async function promoteToModerator(communityId: number | string, userId: number | string): Promise<void> {
  try {
    await api.put(`/communities/${communityId}/promote/${userId}`);
  } catch (error: any) {
    console.error('[communityApi] Error promoting user to moderator:', error);
    throw error;
  }
}

/**
 * Demote a moderator to member
 * PUT /api/v1/communities/{communityId}/demote/{userId}
 * Only OWNER can demote moderators
 */
export async function demoteToMember(communityId: number | string, userId: number | string): Promise<void> {
  try {
    await api.put(`/communities/${communityId}/demote/${userId}`);
  } catch (error: any) {
    console.error('[communityApi] Error demoting moderator to member:', error);
    throw error;
  }
}

/**
 * Get community members with roles
 * GET /api/v1/communities/{communityId}/members/with-roles
 */
export interface CommunityMemberDTO {
  id: number;
  username: string;
  email: string;
  pfp: string;
  points: number;
  about?: string;
  country?: string;
  roles: string[]; // Community roles: 'OWNER', 'MODERATOR', 'MEMBER'
}

export async function getMembersWithRoles(communityId: number | string): Promise<CommunityMemberDTO[]> {
  try {
    const response = await api.get<CommunityMemberDTO[]>(`/communities/${communityId}/members/with-roles`);
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error fetching members with roles:', error);
    throw error;
  }
}

/**
 * Kick a user from the community
 * POST /api/v1/communities/kick/{communityId}?email={userEmail}
 * Only OWNER can kick members
 */
export async function kickUser(communityId: number | string, userEmail: string): Promise<void> {
  try {
    await api.post(`/communities/kick/${communityId}`, null, {
      params: { email: userEmail }
    });
  } catch (error: any) {
    console.error('[communityApi] Error kicking user:', error);
    throw error;
  }
}

