/**
 * TypeScript type definitions for the Dietician App
 */

// User types
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  role: string;  // Backend returns role as a string (dynamic, not hardcoded)
  actions?: string[];
  emailVerified: boolean;
  profilePictureUrl: string | null;
}

export interface Role {
  id: number;
  roleCode: string;  // Dynamic role code from backend
  roleName: string;
}

// Admin types
export interface UserSummary {
  id: number;
  email: string;
  fullName: string | null;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  emailVerified: boolean;
  createdDate: string;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  createdDate: string;
  actions: string[];
}

export interface Action {
  id: number;
  actionCode: string;
  actionName: string;
  description: string;
  module: string;
  isActive: boolean;
  assigned?: boolean;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: string;  // Dynamic role code from backend
  password?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: string;  // Dynamic role code from backend
}

export interface PaginatedUsersResponse {
  content: UserSummary[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
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

// User Profile types
export interface UserProfile {
  id: number;
  userId: number;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  countryCode: string | null;
  mobileNumber: string | null;
  fullPhoneNumber: string | null;
  email: string;
  country: string | null;
  state: string | null;
  addressLine: string | null;
  pincode: string | null;
  profilePhotoUrl: string | null;
  emailVerified: boolean;
  // New JWT tokens when email is updated
  accessToken?: string;
  refreshToken?: string;
  emailChanged?: boolean;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  countryCode: string;
  mobileNumber: string;
  country?: string;
  state?: string;
  addressLine?: string;
  pincode?: string;
}

export interface PhotoUploadResponse {
  message: string;
  profilePhotoUrl: string;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  Home: undefined;
  UserProfile: undefined;
  ResetPassword: undefined;
  AdminDashboard: undefined;
  UserList: { role: string };  // Dynamic role code
  CreateUser: { role: string };  // Dynamic role code
  EditUser: { userId: number };
  RoleManagement: undefined;
  OAuthCallback: undefined;
};

// API Error type
export interface ApiError {
  message: string;
  status?: number;
}

