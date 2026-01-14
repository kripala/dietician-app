/**
 * App configuration
 */

const config = {
    // API Configuration
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api',

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
