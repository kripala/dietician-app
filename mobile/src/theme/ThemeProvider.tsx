/**
 * Theme Provider Component
 * Wraps the app with React Native Paper's PaperProvider
 */

import React, { ReactNode } from 'react';
import { PaperProvider, configureFonts } from 'react-native-paper';
import { lightTheme } from './theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <PaperProvider theme={lightTheme}>
      {children}
    </PaperProvider>
  );
}

export default ThemeProvider;
