import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import config from '../config';
import { User } from '../types';

interface OAuthHandlerProps {
    children: React.ReactNode;
    onOAuthSuccess?: (user: User) => void;
}

/**
 * Component to handle OAuth2 callback when the app loads after redirect.
 * Migrates OAuth tokens from localStorage to AsyncStorage.
 * The actual auth state will be checked by AuthProvider.checkAuthStatus()
 */
export const OAuthHandler: React.FC<OAuthHandlerProps> = ({ children, onOAuthSuccess }) => {
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current || Platform.OS !== 'web') {
            return;
        }

        const processOAuthTokens = async () => {
            try {
                const tokensStr = localStorage.getItem('oauth_tokens');
                if (!tokensStr) {
                    console.log('[OAuthHandler] No OAuth tokens found in localStorage');
                    return;
                }

                const tokens = JSON.parse(tokensStr);
                console.log('[OAuthHandler] Found OAuth tokens, migrating to AsyncStorage');

                // Check if tokens are recent (within 5 minutes)
                if (Date.now() - tokens.timestamp > 5 * 60 * 1000) {
                    console.log('[OAuthHandler] Tokens expired');
                    localStorage.removeItem('oauth_tokens');
                    return;
                }

                // Mark as processed to prevent duplicate processing
                processedRef.current = true;

                // Migrate tokens to AsyncStorage
                await AsyncStorage.multiSet([
                    [config.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
                    [config.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken || tokens.accessToken],
                ]);

                // Store user data
                if (tokens.user) {
                    await AsyncStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(tokens.user));
                }

                // Update apiClient authorization
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

                // Clear from localStorage now that it's in AsyncStorage
                localStorage.removeItem('oauth_tokens');

                console.log('[OAuthHandler] Tokens migrated successfully');

                // Notify parent if callback provided
                if (onOAuthSuccess && tokens.user) {
                    onOAuthSuccess(tokens.user);
                }

            } catch (error) {
                console.error('[OAuthHandler] Error processing tokens:', error);
                localStorage.removeItem('oauth_tokens');
                processedRef.current = true;
            }
        };

        processOAuthTokens();
    }, [onOAuthSuccess]);

    return <>{children}</>;
};

export default OAuthHandler;
