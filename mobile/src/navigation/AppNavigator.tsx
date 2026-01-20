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
        const wasAuthenticated = useRef(false);

        useEffect(() => {
            if (isLoading) return;

            // Navigate when auth state changes
            if (isAuthenticated && !wasAuthenticated.current) {
                // User just logged in - navigate to main tabs
                (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            } else if (!isAuthenticated && wasAuthenticated.current) {
                // User just logged out
                (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                });
            }

            wasAuthenticated.current = isAuthenticated;
        }, [isAuthenticated, user, isLoading, navigation]);

        return null;
    };

const AppNavigator = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer>
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
