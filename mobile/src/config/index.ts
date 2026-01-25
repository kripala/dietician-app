/**
 * App configuration
 * Auto-detects backend URL based on platform (web vs native)
 */
import { Platform } from 'react-native';

// Production API URL
const PRODUCTION_API_URL = 'https://app.mamaarogyam.cloud/api';

// Auto-detect API base URL
const getApiBaseUrl = (): string => {
    // 1. Check environment variable first (for production override)
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
    }

    // 2. For production builds (not in dev mode), use production URL
    if (!__DEV__) {
        return PRODUCTION_API_URL;
    }

    // 3. For web - detect the actual host being accessed
    if (Platform.OS === 'web') {
        // Use window.location to determine the actual host
        const host = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;

        // For local development (localhost or local IP), use backend port 8080
        // For production, nginx handles routing on same port
        const isLocalDev = host === 'localhost' || host === '127.0.0.1' ||
                           host.startsWith('192.168.') || host.startsWith('10.') ||
                           host.startsWith('172.16.');
        if (isLocalDev) {
            return `${protocol}//${host}:8080/api`;
        }
        // API runs on same host as web (nginx handles routing)
        return `${protocol}//${host}/api`;
    }

    // 4. For native (Android/iOS) in development:
    // Try to use the development server's IP
    // On physical device, this will be the machine's local IP
    // On Android emulator, 10.0.2.2 maps to host's localhost
    // On iOS simulator, localhost already works

    // For development on physical device - use your machine's local IP
    const DEV_MACHINE_IP = process.env.DEV_MACHINE_IP || '192.168.0.106';

    // Android emulator special case
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8080/api';
    }
    // iOS simulator can use localhost
    if (Platform.OS === 'ios') {
        return 'http://localhost:8080/api';
    }

    // Physical device in development - use machine's IP
    return `http://${DEV_MACHINE_IP}:8080/api`;
};

const config = {
    // API Configuration - auto-detected
    API_BASE_URL: getApiBaseUrl(),

    // OAuth Configuration
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '201804109447-lda6r5fc0fac15nis0oukghd1u8vhpfr.apps.googleusercontent.com',

    // App Configuration
    APP_NAME: 'Dietitian App',
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
