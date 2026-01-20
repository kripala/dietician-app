/**
 * Custom Card Component
 * Wraps React Native Paper Card with consistent Figma design styling
 * 12px border radius, subtle shadow
 */

import React from 'react';
import { Card as PaperCard, CardProps as PaperCardProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

export type CardProps = PaperCardProps & {
  variant?: 'elevated' | 'outlined' | 'flat';
  fullWidth?: boolean;
  style?: ViewStyle;
};

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  fullWidth = false,
  style,
  children,
  ...props
}) => {
  // Map variant to Paper mode
  const getMode = (): 'elevated' | 'outlined' | 'flat' => {
    return variant;
  };

  return (
    <PaperCard
      mode={getMode()}
      style={[
        styles.card,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={styles.content}
      {...props}
    >
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    padding: 16,
  },
});

export default Card;
