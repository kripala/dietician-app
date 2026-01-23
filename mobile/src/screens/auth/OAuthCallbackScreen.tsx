import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'OAuthCallback'>;

const OAuthCallbackScreen: React.FC<Props> = ({ route, navigation }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const { setUser, setIsAuthenticated } = useAuth();

    useEffect(() => {
        const processOAuthCallback = async () => {
            try {
                // Get code from URL params (web only)
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const error = params.get('error');

                console.log('[OAuthCallbackScreen] Processing callback:', { code: code ? 'present' : 'missing', error });

                if (error) {
                    throw new Error(decodeURIComponent(error));
                }

                if (!code) {
                    throw new Error('No authorization code received');
                }

                // Exchange code for tokens with backend
                console.log('[OAuthCallbackScreen] Exchanging code for tokens...');
                const response = await apiClient.post<{
                    accessToken: string;
                    refreshToken: string;
                    user: any;
                }>('/auth/oauth2/exchange', { code });

                const data = response;
                console.log('[OAuthCallbackScreen] Tokens received, user:', data.user.email);

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
    },
});

export default OAuthCallbackScreen;
