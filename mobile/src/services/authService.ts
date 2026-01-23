import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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

// Configure WebBrowser for native platforms
WebBrowser.maybeCompleteAuthSession();

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
     * Login with Google OAuth2
     * For web: uses same-window redirect (standard OAuth2 flow)
     * For native: uses expo-auth-session
     */
    async loginWithGoogle(): Promise<AuthResponse> {
        if (Platform.OS === 'web') {
            // Build OAuth URL - don't pass redirect_uri, let Spring Security use its configured backend callback URL
            // The backend will redirect to frontend after successful OAuth
            const apiUrl = config.API_BASE_URL;
            const authUrl = `${apiUrl}/auth/oauth2/authorize/google`;

            // Redirect current window to OAuth endpoint
            // Backend will handle OAuth and redirect back to oauth-callback.html with a one-time code
            window.location.href = authUrl;

            // Return a promise that never resolves (page will navigate away)
            return new Promise<AuthResponse>(() => {});
        }

        // For native platforms, use AuthSession
        const redirectUriNative = `${apiUrl}/auth/oauth2/callback/google`;
        try {
            const result = await AuthSession.startAsync({
                authUrl: `${apiUrl}/auth/oauth2/authorize/google`,
                returnUrl: AuthSession.makeRedirectUri({
                    native: redirectUriNative,
                    path: 'auth/oauth2/callback/google',
                }),
            });

            if (result.type === 'success' && result.params) {
                const { access_token, refresh_token } = result.params;
                if (!access_token) {
                    throw new Error('No access token received from OAuth callback');
                }
                return await this.validateOAuthToken(access_token, refresh_token || access_token);
            } else if (result.type === 'cancel') {
                throw new Error('Google Sign-In was cancelled');
            } else {
                throw new Error('Google Sign-In failed');
            }
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            throw error;
        }
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
     * On web, also checks localStorage for OAuth user data
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            // Check AsyncStorage first
            const userData = await AsyncStorage.getItem(config.STORAGE_KEYS.USER_DATA);
            if (userData) {
                return JSON.parse(userData);
            }

            // On web, also check for pending OAuth tokens in localStorage
            if (Platform.OS === 'web') {
                const oauthTokensStr = localStorage.getItem('oauth_tokens');
                if (oauthTokensStr) {
                    try {
                        const oauthTokens = JSON.parse(oauthTokensStr);
                        // Only consider valid if within 5 minutes and has user data
                        if (oauthTokens.timestamp && Date.now() - oauthTokens.timestamp < 5 * 60 * 1000 && oauthTokens.user) {
                            return oauthTokens.user;
                        }
                    } catch {
                        // Invalid token data, ignore
                    }
                }
            }

            return null;
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
     * On web, also checks localStorage for OAuth tokens from recent sign-in
     */
    async isAuthenticated(): Promise<boolean> {
        // Check AsyncStorage first
        const token = await AsyncStorage.getItem(config.STORAGE_KEYS.ACCESS_TOKEN);
        if (token) return true;

        // On web, also check for pending OAuth tokens in localStorage
        if (Platform.OS === 'web') {
            const oauthTokensStr = localStorage.getItem('oauth_tokens');
            if (oauthTokensStr) {
                try {
                    const oauthTokens = JSON.parse(oauthTokensStr);
                    // Only consider valid if within 5 minutes
                    if (oauthTokens.timestamp && Date.now() - oauthTokens.timestamp < 5 * 60 * 1000) {
                        return true;
                    }
                } catch {
                    // Invalid token data, ignore
                }
            }
        }

        return false;
    }

    /**
     * Handle OAuth2 login callback (after Google Sign-In redirect)
     * Parses tokens from the callback URL
     */
    async handleOAuthCallback(callbackUrl: string): Promise<AuthResponse> {
        try {
            // Extract access token and refresh token from callback URL hash or query params
            const url = new URL(callbackUrl);
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const queryParams = new URLSearchParams(url.search);

            // Try to get tokens from hash fragment (for implicit flow) or query params
            const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || hashParams.get('accessToken');
            const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || hashParams.get('refreshToken');

            if (!accessToken) {
                throw new Error('No access token received from OAuth callback');
            }

            // For OAuth2, we need to fetch user data from the backend using the access token
            // The backend should have an endpoint that validates the token and returns user info
            const authResponse: AuthResponse = await this.validateOAuthToken(accessToken, refreshToken || '');

            await this.saveAuthData(authResponse);
            return authResponse;
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }

    /**
     * Validate OAuth2 token with backend and get user data
     */
    private async validateOAuthToken(accessToken: string, refreshToken: string): Promise<AuthResponse> {
        // Store tokens temporarily to make authenticated request
        await AsyncStorage.setItem(config.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        if (refreshToken) {
            await AsyncStorage.setItem(config.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        // Fetch user data using the access token
        const response = await apiClient.get<User>('/auth/me');

        const authResponse: AuthResponse = {
            accessToken,
            refreshToken: refreshToken || accessToken, // Use access token if no refresh token
            expiresIn: 86400000, // 24 hours default
            user: response,
        };

        return authResponse;
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
