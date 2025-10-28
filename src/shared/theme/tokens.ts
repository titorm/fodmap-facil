/**
 * Design Tokens - Sistema de Design Leve
 * Tokens de cor, espaçamento, tipografia e acessibilidade
 */

// Base color palette (used by both themes)
const baseColors = {
  // Primary
  primary50: '#E3F2FD',
  primary100: '#BBDEFB',
  primary500: '#2196F3',
  primary700: '#1976D2',
  primary900: '#0D47A1',

  // Secondary
  secondary50: '#F3E5F5',
  secondary100: '#E1BEE7',
  secondary500: '#9C27B0',
  secondary700: '#7B1FA2',

  // Semantic
  success: '#4CAF50',
  successLight: '#C8E6C9',
  successDark: '#2E7D32',
  warning: '#FF9800',
  warningLight: '#FFE0B2',
  warningDark: '#E65100',
  error: '#F44336',
  errorLight: '#FFCDD2',
  errorDark: '#C62828',
  info: '#2196F3',
  infoLight: '#BBDEFB',
  infoDark: '#1565C0',

  // FODMAP specific
  lowFodmap: '#4CAF50',
  moderateFodmap: '#FF9800',
  highFodmap: '#F44336',
} as const;

// Light theme color palette
export const lightColors = {
  ...baseColors,

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#FAFAFA',

  // Foreground colors
  foreground: '#212121',
  foregroundSecondary: '#616161',
  foregroundTertiary: '#9E9E9E',

  // Surface colors
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Border colors
  border: '#E0E0E0',
  borderFocus: '#2196F3',
  borderError: '#F44336',

  // Text colors
  text: '#212121',
  textSecondary: '#616161',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // Interactive colors
  interactive: '#2196F3',
  interactiveHover: '#1976D2',
  interactivePressed: '#0D47A1',
  interactiveDisabled: '#BDBDBD',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// Dark theme color palette
export const darkColors = {
  ...baseColors,

  // Background colors
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2C2C2C',

  // Foreground colors
  foreground: '#FFFFFF',
  foregroundSecondary: '#B0B0B0',
  foregroundTertiary: '#808080',

  // Surface colors
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',

  // Border colors
  border: '#3C3C3C',
  borderFocus: '#2196F3',
  borderError: '#F44336',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#212121',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // Interactive colors
  interactive: '#2196F3',
  interactiveHover: '#42A5F5',
  interactivePressed: '#64B5F6',
  interactiveDisabled: '#4A4A4A',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

// Legacy export for backward compatibility (defaults to light theme)
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

// Acessibilidade - Tamanhos mínimos de toque
export const accessibility = {
  minTouchTarget: 44, // WCAG 2.1 AA
  minTouchTargetAAA: 48, // WCAG 2.1 AAA
  focusOutlineWidth: 2,
  focusOutlineColor: colors.primary500,
} as const;

export type ColorPalette = typeof lightColors;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Accessibility = typeof accessibility;
