import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { isAdmin, isDietician } from '../utils/roleHelpers';

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

// Placeholder screens for not-yet-implemented features
const PlaceholderScreen: React.FC<{ navigation: any; route: { params: { role?: string } } }> = ({ route }) => (
    <></>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // We could return a splash screen here
        return null;
    }

    const userRoleCode = user?.role;

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {!isAuthenticated ? (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen
                            name="EmailVerification"
                            component={EmailVerificationScreen}
                        />
                    </>
                ) : (
                    // Main App Stack
                    <>
                        {/* Default Home Screen - will handle role-based navigation internally */}
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

                        {/* Admin Routes - Only accessible to ADMIN role */}
                        {isAdmin(userRoleCode) && (
                            <>
                                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                                <Stack.Screen name="UserList" component={UserListScreen} />
                                <Stack.Screen name="CreateUser" component={PlaceholderScreen} />
                                <Stack.Screen name="EditUser" component={PlaceholderScreen} />
                                <Stack.Screen name="RoleManagement" component={PlaceholderScreen} />
                            </>
                        )}

                        {/* Dietician Routes - Only accessible to DIETICIAN role */}
                        {isDietician(userRoleCode) && (
                            <>
                                {/* <Stack.Screen name="DieticianDashboard" component={DieticianDashboardScreen} /> */}
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
