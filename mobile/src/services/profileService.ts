import apiClient from './apiClient';
import { UserProfile, UpdateProfileRequest, PhotoUploadResponse } from '../types';

/**
 * Service for managing user profile operations
 */
class ProfileService {
  /**
   * Get current user's profile
   */
  async getProfile(userId: number): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`/user-profiles/me?userId=${userId}`);
  }

  /**
   * Update or create user profile
   */
  async updateProfile(userId: number, data: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.put<UserProfile>(`/user-profiles/me?userId=${userId}`, data);
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(userId: number, file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());

    return apiClient.post<PhotoUploadResponse>(`/user-profiles/me/photo?userId=${userId}`, formData);
  }

  /**
   * Upload profile photo from URI (for React Native)
   */
  async uploadPhotoFromUri(userId: number, uri: string, type: string = 'image/jpeg', name: string = 'photo.jpg'): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type,
      name,
    } as unknown as File);
    formData.append('userId', userId.toString());

    return apiClient.post<PhotoUploadResponse>(`/user-profiles/me/photo?userId=${userId}`, formData as unknown as string);
  }
}

export default new ProfileService();
