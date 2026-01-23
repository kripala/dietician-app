import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { OAuthHandler } from './src/context/OAuthHandler';
import { RoleProvider } from './src/context/RoleContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <OAuthHandler>
            <RoleProvider>
              <AppNavigator />
              <StatusBar style="auto" />
              <Toast />
            </RoleProvider>
          </OAuthHandler>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
