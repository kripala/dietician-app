/**
 * Custom Button Component
 * Wraps React Native Paper Button with consistent Figma design styling
 * 8px border radius, 12px 24px padding
 */

import React from 'react';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

export type ButtonProps = Omit<PaperButtonProps, 'mode' | 'style'> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  fullWidth?: boolean;
  style?: ViewStyle;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  style,
  children,
  disabled,
  loading,
  ...props
}) => {
  // Map variant to Paper mode
  const getMode = (): 'contained' | 'outlined' | 'text' => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  // Get button color based on variant
  const getButtonColor = () => {
    if (disabled) return undefined;
    switch (variant) {
      case 'secondary':
        return '#FF6B6B'; // Coral accent
      default:
        return undefined; // Use primary from theme
    }
  };

  return (
    <PaperButton
      mode={getMode()}
      buttonColor={getButtonColor()}
      disabled={disabled}
      loading={loading}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={styles.content}
      labelStyle={styles.label}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Button;
