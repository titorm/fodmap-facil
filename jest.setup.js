import '@testing-library/react-native/extend-expect';

// Mock Expo modules
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('expo-sqlite/next', () => ({
  openDatabaseSync: jest.fn(() => ({})),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
