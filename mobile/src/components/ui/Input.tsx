/**
 * Custom Input Component
 * Wraps React Native Paper TextInput with consistent Figma design styling
 * 8px border radius, with label, error, and icon support
 */

import React from 'react';
import { TextInput as PaperTextInput, TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

export type InputProps = Omit<PaperTextInputProps, 'style' | 'theme'> & {
  label?: string;
  error?: boolean;
  helperText?: string;
  style?: ViewStyle;
};

export const Input: React.FC<InputProps> = ({
  label,
  error = false,
  helperText,
  style,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  left,
  right,
  disabled = false,
  ...props
}) => {
  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      disabled={disabled}
      error={error}
      left={left}
      right={right}
      mode="outlined"
      outlineStyle={[
        styles.outline,
        error && styles.outlineError,
      ]}
      style={[styles.input, style]}
      contentStyle={styles.content}
      underlineStyle={styles.underline}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
  },
  outline: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  outlineError: {
    borderColor: '#F44336',
  },
  content: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 48,
  },
  underline: {
    display: 'none',
  },
});

export default Input;
