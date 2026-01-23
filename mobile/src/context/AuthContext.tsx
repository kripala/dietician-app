import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import config from '../config';
import { User, LoginRequest, RegisterRequest, VerifyOtpRequest, Role } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    login: (data: LoginRequest) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (data: RegisterRequest) => Promise<{ message: string }>;
    verifyOtp: (data: VerifyOtpRequest) => Promise<void>;
    resendOtp: (email: string) => Promise<{ message: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
    updateProfilePictureUrl: (photoUrl: string) => Promise<void>;
    updateUserEmail: (email: string) => Promise<void>;
    updateAuthTokens: (email: string, accessToken: string, refreshToken: string) => Promise<void>;
    hasAction: (actionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            console.log('[AuthProvider] checkAuthStatus starting...');
            const authenticated = await authService.isAuthenticated();
            console.log('[AuthProvider] Authentication check result:', authenticated);
            
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const currentUser = await authService.getCurrentUser();
                console.log('[AuthProvider] Current user:', currentUser?.email);
                setUser(currentUser);
            }
        } catch (error) {
            console.error('[AuthProvider] Error checking auth status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginRequest) => {
        try {
            const response = await authService.login(data);
            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            const response = await authService.loginWithGoogle();

            // Store tokens and user data
            await authService.storeTokens(response.accessToken, response.refreshToken);
            await authService.saveUserData(response.user);

            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            const response = await authService.register(data);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const verifyOtp = async (data: VerifyOtpRequest) => {
        try {
            const response = await authService.verifyOtp(data);
            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        }
    };

    const resendOtp = async (email: string) => {
        try {
            const response = await authService.resendOtp({ email });
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
            // Clear state even if API call fails
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const refreshUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    const updateProfilePictureUrl = async (photoUrl: string) => {
        try {
            if (user) {
                const updatedUser = { ...user, profilePictureUrl: photoUrl };
                setUser(updatedUser);
                // Update cached user data in AsyncStorage
                await authService.saveUserData(updatedUser);
            }
        } catch (error) {
            console.error('Error updating profile picture URL:', error);
        }
    };

    const updateUserEmail = async (email: string) => {
        try {
            if (user) {
                const updatedUser = { ...user, email: email };
                setUser(updatedUser);
                // Update cached user data in AsyncStorage
                await authService.saveUserData(updatedUser);
            }
        } catch (error) {
            console.error('Error updating user email:', error);
        }
    };

    const updateAuthTokens = async (email: string, accessToken: string, refreshToken: string) => {
        try {
            // Store the new tokens in AsyncStorage
            await authService.storeTokens(accessToken, refreshToken);
            // Update the user context with the new email
            if (user) {
                const updatedUser = { ...user, email: email };
                setUser(updatedUser);
                await authService.saveUserData(updatedUser);
            }
        } catch (error) {
            console.error('Error updating auth tokens:', error);
        }
    };

    const handleOAuthCallback = async (accessToken: string, refreshToken: string) => {
        try {
            // Store tokens in AsyncStorage
            await authService.storeTokens(accessToken, refreshToken);

            // Temporarily set the token for the API call
            const tempClient = apiClient;
            tempClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Fetch user data using the access token
            const response = await tempClient.get<User>('/auth/me');

            // Store user data in AsyncStorage
            await authService.saveUserData(response);

            // Update auth context with user data
            setUser(response);
            setIsAuthenticated(true);

            console.log('OAuth login successful, user:', response.email);
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        setUser,
        setIsAuthenticated,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
        checkAuthStatus,
        handleOAuthCallback,
        updateProfilePictureUrl,
        updateUserEmail,
        updateAuthTokens,
        hasAction: (actionCode: string) => {
            return user?.actions?.includes(actionCode) ?? false;
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
