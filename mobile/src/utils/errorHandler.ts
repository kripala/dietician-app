import { AxiosError } from 'axios';

/**
 * Extract user-friendly error message from API error
 * Handles different error formats from the backend
 */
export function getErrorMessage(error: any, fallbackMessage: string = 'An error occurred'): string {
    // Network error (no response from server)
    if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return 'Request timeout. Please check your connection and try again.';
        }
        if (error.message === 'Network Error') {
            return 'Network error. Please check your internet connection.';
        }
        return error.message || fallbackMessage;
    }

    // Server returned an error response
    const responseData = error.response.data;

    // Handle standard error response format: { message: "error text" }
    if (responseData?.message) {
        return responseData.message;
    }

    // Handle Spring validation errors format
    if (responseData?.errors || responseData?.fieldErrors) {
        const errors = responseData.errors || responseData.fieldErrors;
        if (Array.isArray(errors)) {
            return errors.map((e: any) => e.defaultMessage || e.message).join(', ');
        }
    }

    // Handle other error formats
    if (typeof responseData === 'string') {
        return responseData;
    }

    return fallbackMessage;
}

/**
 * Check if error is an authentication/authorization error
 */
export function isAuthError(error: any): boolean {
    if (!error.response) return false;
    const status = error.response.status;
    return status === 401 || status === 403;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
    return !error.response && (error.code === 'ECONNABORTED' || error.message === 'Network Error');
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
    return error.response?.status >= 500;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: any): boolean {
    const status = error.response?.status;
    return status >= 400 && status < 500;
}
