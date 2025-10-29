/**
 * App Root Component
 *
 * Main entry point for the FODMAP Fácil application
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/shared/theme';
import { ToastProvider } from './src/shared/components/Toast';
import { AppNavigator } from './src/navigation/AppNavigator';
import { queryClient } from './src/lib/queryClient';
import { useNotificationSetup } from './src/services/notifications/useNotificationSetup';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import './src/shared/i18n'; // Initialize i18n

function AppContent() {
  // Initialize notification infrastructure
  useNotificationSetup();

  return <AppNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
