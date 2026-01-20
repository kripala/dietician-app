/**
 * Role and permission helper utilities
 * These utilities support both dynamic roles (from backend) and fallback roles
 */

import type { Role } from '../types';

// Fallback roles in case backend API is unavailable
const FALLBACK_ROLES: Role[] = [
  { id: 1, roleCode: 'ADMIN', roleName: 'Administrator' },
  { id: 2, roleCode: 'DIETICIAN', roleName: 'Dietician' },
  { id: 3, roleCode: 'PATIENT', roleName: 'Patient' },
];

/**
 * Get the display name for a role code
 * @param roleCode - The role code (e.g., 'ADMIN', 'PATIENT')
 * @param roles - Optional list of roles from backend
 * @returns The display name for the role
 */
export const getRoleDisplayName = (roleCode: string, roles?: Role[]): string => {
  const roleList = roles || FALLBACK_ROLES;
  const role = roleList.find(r => r.roleCode === roleCode);
  return role?.roleName || roleCode;
};

/**
 * Get the color for a role - used for UI badges and avatars
 * @param roleCode - The role code
 * @returns The hex color string
 */
export const getRoleColor = (roleCode: string): string => {
  // Generate consistent color based on role code hash for unknown roles
  const hash = roleCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#DC2626', // Red
    '#4F46E5', // Indigo
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  // Map known roles to specific colors
  switch (roleCode) {
    case 'ADMIN':
      return '#DC2626';
    case 'DIETICIAN':
      return '#4F46E5';
    case 'PATIENT':
      return '#10B981';
    default:
      return colors[hash % colors.length];
  }
};

/**
 * Check if user is an admin
 * @param roleCode - The user's role code
 * @param roles - Optional list of roles from backend
 * @returns true if the user is an admin
 */
export const isAdmin = (roleCode?: string | null, roles?: Role[]): boolean => {
  if (!roleCode) return false;
  const roleList = roles || FALLBACK_ROLES;
  const role = roleList.find(r => r.roleCode === roleCode);
  // Check by role code or role name containing 'admin'
  return role?.roleCode === 'ADMIN' ||
         role?.roleName.toLowerCase().includes('admin') ||
         roleCode === 'ADMIN';
};

/**
 * Check if user is a dietician
 * @param roleCode - The user's role code
 * @param roles - Optional list of roles from backend
 * @returns true if the user is a dietician
 */
export const isDietician = (roleCode?: string | null, roles?: Role[]): boolean => {
  if (!roleCode) return false;
  const roleList = roles || FALLBACK_ROLES;
  const role = roleList.find(r => r.roleCode === roleCode);
  return role?.roleCode === 'DIETICIAN' ||
         role?.roleName.toLowerCase().includes('dietician') ||
         roleCode === 'DIETICIAN';
};

/**
 * Check if user is a patient
 * @param roleCode - The user's role code
 * @param roles - Optional list of roles from backend
 * @returns true if the user is a patient
 */
export const isPatient = (roleCode?: string | null, roles?: Role[]): boolean => {
  if (!roleCode) return false;
  const roleList = roles || FALLBACK_ROLES;
  const role = roleList.find(r => r.roleCode === roleCode);
  return role?.roleCode === 'PATIENT' ||
         role?.roleName.toLowerCase().includes('patient') ||
         roleCode === 'PATIENT';
};

/**
 * Get role by code
 * @param roleCode - The role code to look up
 * @param roles - Optional list of roles from backend
 * @returns The role object or undefined
 */
export const getRoleByCode = (roleCode: string, roles?: Role[]): Role | undefined => {
  const roleList = roles || FALLBACK_ROLES;
  return roleList.find(r => r.roleCode === roleCode);
};

/**
 * Get fallback roles - useful when API is unavailable
 */
export const getFallbackRoles = (): Role[] => FALLBACK_ROLES;
