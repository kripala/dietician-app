/**
 * TypeScript type definitions for the Dietician App
 */

// User types
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  Home: undefined;
};

// API Error type
export interface ApiError {
  message: string;
  status?: number;
}
