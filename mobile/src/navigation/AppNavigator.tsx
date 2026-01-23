import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { isAdmin } from '../utils/roleHelpers';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import OAuthCallbackScreen from '../screens/auth/OAuthCallbackScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import ResetPasswordScreen from '../screens/profile/ResetPasswordScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserListScreen from '../screens/admin/UserListScreen';

// Tab Navigator
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation handler component that responds to auth state changes
const NavigationStateHandler: React.FC<{ user: any; isAuthenticated: boolean; isLoading: boolean }> =
    ({ user, isAuthenticated, isLoading }) => {
        const navigation = useNavigation();

        useEffect(() => {
            console.log('[NavigationStateHandler] State changed:', { isLoading, isAuthenticated, user: user?.email });

            if (isLoading) {
                console.log('[NavigationStateHandler] Still loading, waiting...');
                return;
            }

            // Always navigate based on current auth state
            if (isAuthenticated) {
                console.log('[NavigationStateHandler] User IS authenticated, navigating to MainTabs');
                (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            } else {
                console.log('[NavigationStateHandler] User NOT authenticated, showing Welcome');
                // Don't reset if already on welcome to prevent loops
                (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                });
            }
        }, [isAuthenticated, isLoading, user, navigation]);

        return null;
    };

const AppNavigator = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    // Linking configuration for web deep linking
    const linking = {
        prefixes: ['http://localhost:8081'],
        config: {
            screens: {
                OAuthCallback: {
                    path: 'oauth-callback',
                },
            },
        },
    };

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
                initialRouteName={!isAuthenticated ? 'Welcome' : 'MainTabs'}
            >
                {/* Auth Flow */}
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />

                {/* Main App with Bottom Tabs */}
                <Stack.Screen
                    name="MainTabs"
                    component={TabNavigator}
                    options={{
                        gestureEnabled: false, // Disable swipe back on main tabs
                    }}
                />

                {/* Additional screens that can be accessed from tabs */}
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="UserList" component={UserListScreen} />
            </Stack.Navigator>

            {/* Navigation state handler */}
            <NavigationStateHandler user={user} isAuthenticated={isAuthenticated} isLoading={isLoading} />
        </NavigationContainer>
    );
};

export default AppNavigator;
