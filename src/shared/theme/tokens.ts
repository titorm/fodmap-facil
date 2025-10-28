/**
 * Design Tokens - Sistema de Design Leve
 * Tokens de cor, espaçamento, tipografia e acessibilidade
 */

export const colors = {
  // Primary
  primary50: "#E3F2FD",
  primary100: "#BBDEFB",
  primary500: "#2196F3",
  primary700: "#1976D2",
  primary900: "#0D47A1",

  // Secondary
  secondary50: "#F3E5F5",
  secondary100: "#E1BEE7",
  secondary500: "#9C27B0",
  secondary700: "#7B1FA2",

  // Neutral
  neutral0: "#FFFFFF",
  neutral50: "#FAFAFA",
  neutral100: "#F5F5F5",
  neutral200: "#EEEEEE",
  neutral300: "#E0E0E0",
  neutral400: "#BDBDBD",
  neutral500: "#9E9E9E",
  neutral600: "#757575",
  neutral700: "#616161",
  neutral800: "#424242",
  neutral900: "#212121",
  neutral1000: "#000000",

  // Semantic
  success: "#4CAF50",
  successLight: "#C8E6C9",
  warning: "#FF9800",
  warningLight: "#FFE0B2",
  error: "#F44336",
  errorLight: "#FFCDD2",
  info: "#2196F3",
  infoLight: "#BBDEFB",

  // FODMAP specific
  lowFodmap: "#4CAF50",
  moderateFodmap: "#FF9800",
  highFodmap: "#F44336",
} as const;

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
    regular: "System",
    medium: "System",
    bold: "System",
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
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
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

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
