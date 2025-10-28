import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppNavigator } from '../AppNavigator';
import { ThemeProvider } from '../../shared/theme/ThemeProvider';
import i18n from '../../shared/i18n';

// Mock the auth hook
jest.mock('../../shared/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
  })),
}));

// Mock the screen components to avoid rendering complexity
jest.mock('../../features/reintroduction/screens/ReintroductionHomeScreen', () => ({
  ReintroductionHomeScreen: () => null,
}));

jest.mock('../../features/journey/screens/JourneyScreen', () => ({
  JourneyScreen: () => null,
}));

jest.mock('../../features/diary/screens/DiaryScreen', () => ({
  DiaryScreen: () => null,
}));

jest.mock('../../features/reports/screens/ReportsScreen', () => ({
  ReportsScreen: () => null,
}));

jest.mock('../../features/profile/screens/ProfileScreen', () => ({
  ProfileScreen: () => null,
}));

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement, themeMode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider initialMode={themeMode}>{ui}</ThemeProvider>);
}

describe('AppNavigator Integration Tests', () => {
  beforeEach(() => {
    // Reset language to English before each test
    i18n.changeLanguage('en');
  });

  describe('Tab Navigation Flow', () => {
    it('should navigate between all five tabs', async () => {
      const { getByLabelText } = renderWithProviders(<AppNavigator />);

      // Verify all tabs are present
      const homeTab = getByLabelText('Home tab');
      const jornadaTab = getByLabelText('Jornada tab');
      const diarioTab = getByLabelText('Diário tab');
      const relatoriosTab = getByLabelText('Relatórios tab');
      const perfilTab = getByLabelText('Perfil tab');

      expect(homeTab).toBeTruthy();
      expect(jornadaTab).toBeTruthy();
      expect(diarioTab).toBeTruthy();
      expect(relatoriosTab).toBeTruthy();
      expect(perfilTab).toBeTruthy();

      // Navigate to Jornada tab
      fireEvent.press(jornadaTab);
      await waitFor(() => {
        expect(jornadaTab.props.accessibilityState?.selected).toBe(true);
      });

      // Navigate to Diário tab
      fireEvent.press(diarioTab);
      await waitFor(() => {
        expect(diarioTab.props.accessibilityState?.selected).toBe(true);
      });

      // Navigate to Relatórios tab
      fireEvent.press(relatoriosTab);
      await waitFor(() => {
        expect(relatoriosTab.props.accessibilityState?.selected).toBe(true);
      });

      // Navigate to Perfil tab
      fireEvent.press(perfilTab);
      await waitFor(() => {
        expect(perfilTab.props.accessibilityState?.selected).toBe(true);
      });

      // Navigate back to Home tab
      fireEvent.press(homeTab);
      await waitFor(() => {
        expect(homeTab.props.accessibilityState?.selected).toBe(true);
      });
    });

    it('should maintain tab state when switching between tabs', async () => {
      const { getByLabelText } = renderWithProviders(<AppNavigator />);

      const homeTab = getByLabelText('Home tab');
      const jornadaTab = getByLabelText('Jornada tab');

      // Start on Home tab (default)
      expect(homeTab.props.accessibilityState?.selected).toBe(true);

      // Navigate to Jornada
      fireEvent.press(jornadaTab);
      await waitFor(() => {
        expect(jornadaTab.props.accessibilityState?.selected).toBe(true);
      });

      // Navigate back to Home
      fireEvent.press(homeTab);
      await waitFor(() => {
        expect(homeTab.props.accessibilityState?.selected).toBe(true);
      });
    });
  });

  describe('Theme Switching Integration', () => {
    it('should render navigation with light theme', () => {
      const { getByLabelText } = renderWithProviders(<AppNavigator />, 'light');

      const homeTab = getByLabelText('Home tab');
      expect(homeTab).toBeTruthy();
    });

    it('should render navigation with dark theme', () => {
      const { getByLabelText } = renderWithProviders(<AppNavigator />, 'dark');

      const homeTab = getByLabelText('Home tab');
      expect(homeTab).toBeTruthy();
    });

    it('should maintain navigation state when theme changes', async () => {
      const { getByLabelText, rerender } = renderWithProviders(<AppNavigator />, 'light');

      // Navigate to Jornada tab
      const jornadaTab = getByLabelText('Jornada tab');
      fireEvent.press(jornadaTab);

      await waitFor(() => {
        expect(jornadaTab.props.accessibilityState?.selected).toBe(true);
      });

      // Switch to dark theme
      rerender(
        <ThemeProvider initialMode="dark">
          <AppNavigator />
        </ThemeProvider>
      );

      // Verify Jornada tab is still selected
      const jornadaTabAfterThemeChange = getByLabelText('Jornada tab');
      expect(jornadaTabAfterThemeChange.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('Language Switching Integration', () => {
    it('should display tab labels in English', () => {
      const { getByText } = renderWithProviders(<AppNavigator />);

      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Jornada')).toBeTruthy();
      expect(getByText('Diário')).toBeTruthy();
      expect(getByText('Relatórios')).toBeTruthy();
      expect(getByText('Perfil')).toBeTruthy();
    });

    it('should maintain navigation state when language changes', async () => {
      const { getByLabelText, rerender } = renderWithProviders(<AppNavigator />);

      // Navigate to Diário tab
      const diarioTab = getByLabelText('Diário tab');
      fireEvent.press(diarioTab);

      await waitFor(() => {
        expect(diarioTab.props.accessibilityState?.selected).toBe(true);
      });

      // Change language to Portuguese
      await i18n.changeLanguage('pt');

      // Re-render to apply language change
      rerender(
        <ThemeProvider initialMode="light">
          <AppNavigator />
        </ThemeProvider>
      );

      // Verify Diário tab is still selected
      const diarioTabAfterLanguageChange = getByLabelText('Diário tab');
      expect(diarioTabAfterLanguageChange.props.accessibilityState?.selected).toBe(true);
    });

    it('should navigate correctly after language switch', async () => {
      const { getByLabelText } = renderWithProviders(<AppNavigator />);

      // Change language to Portuguese
      await i18n.changeLanguage('pt');

      // Navigate between tabs
      const homeTab = getByLabelText('Home tab');
      const perfilTab = getByLabelText('Perfil tab');

      fireEvent.press(perfilTab);
      await waitFor(() => {
        expect(perfilTab.props.accessibilityState?.selected).toBe(true);
      });

      fireEvent.press(homeTab);
      await waitFor(() => {
        expect(homeTab.props.accessibilityState?.selected).toBe(true);
      });
    });
  });

  describe('Combined Integration Scenarios', () => {
    it('should handle tab navigation with theme and language changes', async () => {
      const { getByLabelText, rerender } = renderWithProviders(<AppNavigator />, 'light');

      // Navigate to Relatórios tab
      const relatoriosTab = getByLabelText('Relatórios tab');
      fireEvent.press(relatoriosTab);

      await waitFor(() => {
        expect(relatoriosTab.props.accessibilityState?.selected).toBe(true);
      });

      // Switch theme to dark
      rerender(
        <ThemeProvider initialMode="dark">
          <AppNavigator />
        </ThemeProvider>
      );

      // Change language to Portuguese
      await i18n.changeLanguage('pt');

      // Verify Relatórios tab is still selected
      const relatoriosTabAfterChanges = getByLabelText('Relatórios tab');
      expect(relatoriosTabAfterChanges.props.accessibilityState?.selected).toBe(true);

      // Navigate to another tab
      const jornadaTab = getByLabelText('Jornada tab');
      fireEvent.press(jornadaTab);

      await waitFor(() => {
        expect(jornadaTab.props.accessibilityState?.selected).toBe(true);
      });
    });
  });
});
