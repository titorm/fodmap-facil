/**
 * App Root Component
 *
 * Main entry point for the FODMAP Fácil application
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/shared/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { queryClient } from './src/lib/queryClient';
import { useNotificationSetup } from './src/services/notifications/useNotificationSetup';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';

function AppContent() {
  // Initialize notification infrastructure
  useNotificationSetup();

  return <AppNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
