import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { lightColors, darkColors } from '../tokens';

// Test component that uses the theme
function TestComponent() {
  const { theme, themeMode, toggleTheme } = useTheme();

  return (
    <>
      <Text testID="theme-mode">{themeMode}</Text>
      <Text testID="is-dark">{theme.isDark ? 'dark' : 'light'}</Text>
      <Text testID="background-color">{theme.colors.background}</Text>
      <Text testID="text-color">{theme.colors.text}</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  it('should provide light theme by default when system is light', () => {
    const { getByTestID } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestID('is-dark').props.children).toBe('light');
    expect(getByTestID('background-color').props.children).toBe(lightColors.background);
  });

  it('should provide theme values to children', () => {
    const { getByTestID } = render(
      <ThemeProvider initialMode="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestID('theme-mode').props.children).toBe('light');
    expect(getByTestID('background-color').props.children).toBe(lightColors.background);
    expect(getByTestID('text-color').props.children).toBe(lightColors.text);
  });

  it('should provide dark theme when initialMode is dark', () => {
    const { getByTestID } = render(
      <ThemeProvider initialMode="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestID('is-dark').props.children).toBe('dark');
    expect(getByTestID('background-color').props.children).toBe(darkColors.background);
    expect(getByTestID('text-color').props.children).toBe(darkColors.text);
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });
});
