import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import config from '../config';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    MessageResponse,
    User,
} from '../types';

/**
 * Authentication service for user registration, login, and OTP verification
 */
class AuthService {
    /**
     * Register a new user with email and password
     */
    async register(data: RegisterRequest): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>('/auth/register', data);
        return response;
    }

    /**
     * Login with email and password
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        await this.saveAuthData(response);
        return response;
    }

    /**
     * Verify email with OTP code
     */
    async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/verify-email', data);
        await this.saveAuthData(response);
        return response;
    }

    /**
     * Resend OTP code
     */
    async resendOtp(data: ResendOtpRequest): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>('/auth/resend-otp', data);
        return response;
    }

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = await AsyncStorage.getItem(config.STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<AuthResponse>('/auth/refresh', {
            refreshToken,
        });

        await this.saveAuthData(response);
        return response;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            // Continue with logout even if API call fails
            console.error('Logout API error:', error);
        } finally {
            await this.clearAuthData();
        }
    }

    /**
     * Get current user from storage
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(config.STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Update user data in storage
     */
    async saveUserData(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    /**
     * Store new access and refresh tokens
     */
    async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
        try {
            await AsyncStorage.multiSet([
                [config.STORAGE_KEYS.ACCESS_TOKEN, accessToken],
                [config.STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
            ]);
        } catch (error) {
            console.error('Error storing tokens:', error);
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await AsyncStorage.getItem(config.STORAGE_KEYS.ACCESS_TOKEN);
        return !!token;
    }

    /**
     * Save authentication data to storage
     */
    private async saveAuthData(authResponse: AuthResponse): Promise<void> {
        await AsyncStorage.multiSet([
            [config.STORAGE_KEYS.ACCESS_TOKEN, authResponse.accessToken],
            [config.STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken],
            [config.STORAGE_KEYS.USER_DATA, JSON.stringify(authResponse.user)],
        ]);
    }

    /**
     * Clear authentication data from storage
     */
    private async clearAuthData(): Promise<void> {
        await AsyncStorage.multiRemove([
            config.STORAGE_KEYS.ACCESS_TOKEN,
            config.STORAGE_KEYS.REFRESH_TOKEN,
            config.STORAGE_KEYS.USER_DATA,
        ]);
    }
}

export default new AuthService();
