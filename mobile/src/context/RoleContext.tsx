import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

interface Role {
  id: number;
  roleCode: string;
  roleName: string;
}

interface RoleContextType {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  refreshRoles: () => Promise<void>;
  getRoleByCode: (code: string) => Role | undefined;
  getRoleById: (id: number) => Role | undefined;
  getRoleCodes: () => string[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLES_STORAGE_KEY = '@dietician_roles';
const ROLES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface RolesData {
  roles: Role[];
  timestamp: number;
}

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Don't block app
  const [error, setError] = useState<string | null>(null);

  // Load roles from storage first, then try to fetch from API
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      // First, try to load from cache
      const cachedData = await AsyncStorage.getItem(ROLES_STORAGE_KEY);
      if (cachedData) {
        const parsed: RolesData = JSON.parse(cachedData);
        const age = Date.now() - parsed.timestamp;

        // Use cache if it's fresh
        if (age < ROLES_CACHE_DURATION && parsed.roles.length > 0) {
          setRoles(parsed.roles);
          setIsLoading(false);
          return;
        }
      }

      // Set fallback roles immediately so app doesn't block
      const fallbackRoles = getFallbackRoles();
      setRoles(fallbackRoles);

      // Fetch from API in background
      fetchRolesFromAPI().catch(() => {
        // Silently use fallback if API fails
        setError(null);
      });
    } catch (err) {
      console.error('Error loading roles:', err);
      const fallbackRoles = getFallbackRoles();
      setRoles(fallbackRoles);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolesFromAPI = async () => {
    try {
      const response = await apiClient.get<Role[]>('/admin/roles');

      if (Array.isArray(response) && response.length > 0) {
        setRoles(response);

        // Cache the roles
        const data: RolesData = {
          roles: response,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(data));
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch roles from API, using fallbacks');
      throw err;
    }
  };

  const refreshRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchRolesFromAPI();
    } catch (err) {
      const fallbackRoles = getFallbackRoles();
      setRoles(fallbackRoles);
      setError('Using default roles');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleByCode = (code: string): Role | undefined => {
    return roles.find(r => r.roleCode === code);
  };

  const getRoleById = (id: number): Role | undefined => {
    return roles.find(r => r.id === id);
  };

  const getRoleCodes = (): string[] => {
    return roles.map(r => r.roleCode);
  };

  const value: RoleContextType = {
    roles,
    isLoading,
    error,
    refreshRoles,
    getRoleByCode,
    getRoleById,
    getRoleCodes,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

/**
 * Fallback roles in case API is unavailable
 * These should match the seed data in the backend
 */
const getFallbackRoles = (): Role[] => [
  { id: 1, roleCode: 'ADMIN', roleName: 'Administrator' },
  { id: 2, roleCode: 'DIETICIAN', roleName: 'Dietician' },
  { id: 3, roleCode: 'PATIENT', roleName: 'Patient' },
];

export const useRoles = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RoleProvider');
  }
  return context;
};

/**
 * Helper functions that don't require context
 */
export const getRoleDisplayName = (roleCode: string, roles?: Role[]): string => {
  const roleList = roles || getFallbackRoles();
  const role = roleList.find(r => r.roleCode === roleCode);
  return role?.roleName || roleCode;
};

export const getRoleColor = (roleCode: string, roles?: Role[]): string => {
  // Generate consistent color based on role code hash
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

  // Use hash to pick a color, but map known roles to specific colors
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

export const isAdmin = (roleCode: string | null | undefined): boolean => {
  return roleCode === 'ADMIN';
};

export const isDietician = (roleCode: string | null | undefined): boolean => {
  return roleCode === 'DIETICIAN';
};

export const isPatient = (roleCode: string | null | undefined): boolean => {
  return roleCode === 'PATIENT';
};
