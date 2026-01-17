/**
 * Role and permission helper utilities
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  DIETICIAN: 'DIETICIAN',
  PATIENT: 'PATIENT',
} as const;

export type RoleCode = typeof ROLES[keyof typeof ROLES];

/**
 * Check if user has a specific action permission
 */
export const hasAction = (userActions: string[] | undefined, actionCode: string): boolean => {
  return userActions?.includes(actionCode) ?? false;
};

/**
 * Check if user is an admin
 */
export const isAdmin = (roleCode?: string | null): boolean => {
  return roleCode === ROLES.ADMIN;
};

/**
 * Check if user is a dietician
 */
export const isDietician = (roleCode?: string | null): boolean => {
  return roleCode === ROLES.DIETICIAN;
};

/**
 * Check if user is a patient
 */
export const isPatient = (roleCode?: string | null): boolean => {
  return roleCode === ROLES.PATIENT;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (roleCode: string): string => {
  switch (roleCode) {
    case ROLES.ADMIN:
      return 'Administrator';
    case ROLES.DIETICIAN:
      return 'Dietician';
    case ROLES.PATIENT:
      return 'Patient';
    default:
      return roleCode;
  }
};

/**
 * Get role color for UI
 */
export const getRoleColor = (roleCode: string): string => {
  switch (roleCode) {
    case ROLES.ADMIN:
      return '#DC2626'; // Red
    case ROLES.DIETICIAN:
      return '#4F46E5'; // Indigo
    case ROLES.PATIENT:
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};
