import apiClient from './apiClient';
import { UserProfile, UpdateProfileRequest, PhotoUploadResponse, AuthResponse, MessageResponse } from '../types';

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

  // ============================================
  // Email Change Verification Methods
  // ============================================

  /**
   * Send OTP to new email for email change verification
   */
  async sendEmailChangeVerification(userId: number, newEmail: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/user-profiles/email/send-verification?userId=${userId}`, { newEmail });
  }

  /**
   * Confirm email change with OTP
   * Returns new auth tokens with updated email
   */
  async confirmEmailChange(userId: number, newEmail: string, otpCode: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`/user-profiles/email/confirm-change?userId=${userId}`, { newEmail, otpCode });
  }

  /**
   * Resend OTP for email change verification
   */
  async resendEmailChangeOtp(userId: number, newEmail: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/user-profiles/email/resend-otp?userId=${userId}`, { newEmail });
  }

  /**
   * Update email for OAuth users (direct update, no OTP)
   * User will be logged out and must sign in with new Google account
   */
  async updateEmailForOAuthUser(userId: number, newEmail: string): Promise<UserProfile> {
    return apiClient.post<UserProfile>(`/user-profiles/email/oauth-update?userId=${userId}`, { newEmail });
  }
}

export default new ProfileService();
