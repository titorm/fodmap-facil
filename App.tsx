import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/infrastructure/database/client';
import { ThemeProvider } from './src/shared/theme';
import { queryClient } from './src/lib/queryClient';
import './src/shared/i18n';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
