/**
 * App configuration
 * Auto-detects backend URL based on platform (web vs native)
 */
import { Platform } from 'react-native';

// Auto-detect API base URL
const getApiBaseUrl = (): string => {
    // 1. Check environment variable first (for production override)
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
    }

    // 2. For web - detect the actual host being accessed
    if (Platform.OS === 'web') {
        // Use window.location to determine the actual host
        // If accessed via localhost, use localhost
        // If accessed via IP, use that same IP for API
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        // API runs on port 8080
        return `${protocol}//${host}:8080/api`;
    }

    // 3. For native (Android/iOS) in development:
    // Try to use the development server's IP
    // On physical device, this will be the machine's local IP
    // On Android emulator, 10.0.2.2 maps to host's localhost
    // On iOS simulator, localhost already works

    // For development on physical device - use your machine's local IP
    // You can set this as env var or modify here
    const DEV_MACHINE_IP = process.env.DEV_MACHINE_IP || '192.168.0.106';

    // Common emulator/simulator IPs
    if (__DEV__) {
        // Android emulator special case
        if (Platform.OS === 'android' && !isRunningOnPhysicalDevice()) {
            return 'http://10.0.2.2:8080/api';
        }
        // iOS simulator can use localhost, but physical device needs machine IP
        if (Platform.OS === 'ios' && !isRunningOnPhysicalDevice()) {
            return 'http://localhost:8080/api';
        }
    }

    // Physical device - use machine's IP
    return `http://${DEV_MACHINE_IP}:8080/api`;
};

// Helper to detect if running on physical device vs simulator/emulator
const isRunningOnPhysicalDevice = (): boolean => {
    // This is a simplified check - React Native doesn't have a built-in way
    // For more accurate detection, you can use react-native-device-info
    return !(__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android'));
};

const config = {
    // API Configuration - auto-detected
    API_BASE_URL: getApiBaseUrl(),

    // OAuth Configuration
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

    // App Configuration
    APP_NAME: 'Dietician App',
    APP_VERSION: '1.0.0',

    // Token storage keys
    STORAGE_KEYS: {
        ACCESS_TOKEN: '@dietician_access_token',
        REFRESH_TOKEN: '@dietician_refresh_token',
        USER_DATA: '@dietician_user_data',
    },

    // API Timeouts
    API_TIMEOUT: 30000, // 30 seconds

    // OTP Configuration
    OTP_LENGTH: 6,
    OTP_EXPIRY_MINUTES: 5,
};

export default config;
