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

export interface CommunityResponseDTO {
  id: number;
  name: string;
  logo?: string;
  location?: string;
  about?: string;
  rules?: string[];
  inviteCode?: string;
  userIds?: number[];
}

/**
 * Create a new community (Admin only)
 * POST /api/v1/communities
 * Accepts multipart/form-data with community data and optional image file
 */
export async function createCommunity(
  data: CommunityRequestDTO,
  imageUri: string | null = null
): Promise<CommunityResponseDTO> {
  try {
    const formData = new FormData();
    
    // Append the JSON data as a string
    formData.append('data', JSON.stringify(data));
    
    // Append the image file if provided
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'logo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }
    
    // DO NOT set Content-Type header manually - Axios will set it automatically
    // with the correct boundary for multipart/form-data
    const response = await api.post<CommunityResponseDTO>('/communities', formData);
    
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error creating community:', error);
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

