import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../config';

/**
 * Axios HTTP client for backend API communication
 */
class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: appConfig.API_BASE_URL,
            timeout: appConfig.API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - Add auth token to requests
        this.client.interceptors.request.use(
            async (requestConfig) => {
                const token = await AsyncStorage.getItem(appConfig.STORAGE_KEYS.ACCESS_TOKEN);
                if (token) {
                    requestConfig.headers.Authorization = `Bearer ${token}`;
                }

                // Remove Content-Type header for FormData to let axios set it automatically with boundary
                if (requestConfig.data instanceof FormData) {
                    delete requestConfig.headers['Content-Type'];
                }

                return requestConfig;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - Handle errors and token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                // Handle 401 Unauthorized - Try to refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = await AsyncStorage.getItem(
                            appConfig.STORAGE_KEYS.REFRESH_TOKEN
                        );

                        if (refreshToken) {
                            const response = await this.client.post('/auth/refresh', {
                                refreshToken,
                            });

                            const { accessToken } = response.data;
                            await AsyncStorage.setItem(
                                appConfig.STORAGE_KEYS.ACCESS_TOKEN,
                                accessToken
                            );

                            // Retry original request with new token
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed - Clear tokens and redirect to login
                        await this.clearAuth();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private async clearAuth() {
        await AsyncStorage.multiRemove([
            appConfig.STORAGE_KEYS.ACCESS_TOKEN,
            appConfig.STORAGE_KEYS.REFRESH_TOKEN,
            appConfig.STORAGE_KEYS.USER_DATA,
        ]);
    }

    // HTTP Methods
    async get<T>(url: string, params?: any): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    async patch<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
        return response.data;
    }
}

export default new ApiClient();
