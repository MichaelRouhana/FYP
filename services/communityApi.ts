// services/communityApi.ts
// API service for Community operations

import api from './api';

export interface CommunityRequestDTO {
  name: string;
  shortDescription?: string;
  description: string;
  isPrivate?: boolean;
  logoUrl?: string;
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
  userIds?: number[];
}

/**
 * Create a new community (Admin only)
 * POST /api/v1/communities
 */
export async function createCommunity(data: CommunityRequestDTO): Promise<CommunityResponseDTO> {
  try {
    const response = await api.post<CommunityResponseDTO>('/communities', data);
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error creating community:', error);
    throw error;
  }
}

