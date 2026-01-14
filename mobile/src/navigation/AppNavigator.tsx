import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

// Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // We could return a splash screen here
        return null;
    }

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
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
