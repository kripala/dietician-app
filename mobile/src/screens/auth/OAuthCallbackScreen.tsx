import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'OAuthCallback'>;

const OAuthCallbackScreen: React.FC<Props> = ({ route, navigation }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const { setUser, setIsAuthenticated } = useAuth();

    useEffect(() => {
        const processOAuthCallback = async () => {
            // Only process on web platform
            if (Platform.OS !== 'web') {
                setErrorMessage('OAuth callback is only supported on web');
                setStatus('error');
                return;
            }

            try {
                // Get current URL and params for debugging
                const currentUrl = window.location.href;
                const searchParams = window.location.search;
                const params = new URLSearchParams(searchParams);
                const code = params.get('code');
                const error = params.get('error');

                console.log('[OAuthCallbackScreen] Processing callback:', { currentUrl, code: code ? 'present' : 'missing', error });

                // Show debug info on screen
                setDebugInfo(`URL: ${currentUrl}\nCode: ${code || 'missing'}\nError: ${error || 'none'}`);

                if (error) {
                    throw new Error(decodeURIComponent(error));
                }

                if (!code) {
                    throw new Error('No authorization code received');
                }

                // Exchange code for tokens with backend
                console.log('[OAuthCallbackScreen] Exchanging code for tokens...');
                setDebugInfo(prev => `${prev}\nExchanging code for tokens...`);
                const response = await apiClient.post<{
                    accessToken: string;
                    refreshToken: string;
                    user: any;
                }>('/auth/oauth2/exchange', { code });

                const data = response;
                console.log('[OAuthCallbackScreen] Tokens received, user:', data.user.email);
                setDebugInfo(prev => `${prev}\nSuccess! User: ${data.user.email}`);

                // Update auth state (tokens are stored by backend exchange)
                setUser(data.user);
                setIsAuthenticated(true);

                setStatus('success');

                // Navigate to home after a short delay
                setTimeout(() => {
                    (navigation as any).replace('MainTabs');
                }, 500);

            } catch (err: any) {
                console.error('[OAuthCallbackScreen] Error:', err);
                setDebugInfo(prev => `${prev}\nError: ${err.message || 'Unknown error'}`);
                setStatus('error');
                setErrorMessage(err.message || 'Authentication failed');

                // Navigate back to welcome after error
                setTimeout(() => {
                    (navigation as any).replace('Welcome');
                }, 3000);
            }
        };

        processOAuthCallback();
    }, [route, navigation, setUser, setIsAuthenticated]);

    return (
        <View style={styles.container}>
            {status === 'loading' && (
                <>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.message}>Completing sign-in...</Text>
                </>
            )}
            {status === 'success' && (
                <>
                    <Text style={styles.title}>Success!</Text>
                    <Text style={styles.message}>Redirecting...</Text>
                </>
            )}
            {status === 'error' && (
                <>
                    <Text style={styles.title}>Authentication Failed</Text>
                    <Text style={styles.message}>{errorMessage}</Text>
                </>
            )}

            {/* Debug info - always visible */}
            <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>DEBUG INFO:</Text>
                <Text style={styles.debugText}>{debugInfo || 'Waiting...'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#667eea',
        padding: 40,
    },
    title: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 30,
    },
    debugContainer: {
        marginTop: 40,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        width: '100%',
    },
    debugTitle: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
        lineHeight: 18,
    },
});

export default OAuthCallbackScreen;
