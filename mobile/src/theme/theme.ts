/**
 * Design System Theme Configuration
 * Based on Nutrizy Nutrition App UI Kit by Monodeep Samanta
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Color Tokens
export const colors = {
  // Primary - Indigo/Purple
  primary: '#4F46E5',
  primaryLight: '#667eea',
  primaryDark: '#4338ca',

  // Accent
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F5F5F5',

  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  textHint: '#9E9E9E',

  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Status colors
  success: '#10B981',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
};

// Spacing Tokens
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius Tokens
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Typography Scale
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadow Tokens
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

// React Native Paper Light Theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.accent,
    secondaryContainer: colors.accentLight,
    background: colors.background,
    surface: colors.backgroundSecondary,
    surfaceVariant: colors.backgroundTertiary,
    onPrimary: colors.textLight,
    onSecondary: colors.textLight,
    onBackground: colors.text,
    onSurface: colors.text,
    onError: colors.textLight,
    error: colors.error,
    outline: colors.border,
    outlineVariant: colors.borderLight,
    inverseSurface: colors.text,
    inverseOnSurface: colors.textLight,
    inversePrimary: colors.primaryLight,
    elevation: {
      level0: colors.background,
      level1: colors.background,
      level2: colors.backgroundSecondary,
      level3: colors.backgroundSecondary,
      level4: colors.backgroundTertiary,
      level5: colors.backgroundTertiary,
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: typography.fontFamily.regular,
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: typography.fontFamily.medium,
      fontWeight: '500' as const,
    },
    mediumItalic: {
      fontFamily: typography.fontFamily.medium,
      fontWeight: '500' as const,
      fontStyle: 'italic' as const,
    },
    semibold: {
      fontFamily: typography.fontFamily.semibold,
      fontWeight: '600' as const,
    },
    bold: {
      fontFamily: typography.fontFamily.bold,
      fontWeight: '700' as const,
    },
  },
};

// Dark theme (optional - for future use)
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primaryDark,
    secondary: colors.accentLight,
  },
};

export default lightTheme;
