import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/infrastructure/database/client';
import { ThemeProvider } from './src/shared/theme';
import { queryClient } from './src/lib/queryClient';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { ToastProvider } from './src/shared/components/Toast';
import './src/shared/i18n';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to error reporting service in production
    console.error('App Error:', error, errorInfo);
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  const handleReset = () => {
    // Reset any global state if needed
    queryClient.clear();
  };

  return (
    <ErrorBoundary onError={handleError} onReset={handleReset}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
