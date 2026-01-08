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
    
    const response = await api.post<CommunityResponseDTO>('/communities', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('[communityApi] Error creating community:', error);
    throw error;
  }
}

