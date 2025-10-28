module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/services/repositories/__tests__/**/*.test.ts'],
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node'],
      },
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/services/repositories/**/*.ts',
    '!src/services/repositories/**/*.test.ts',
    '!src/services/repositories/__tests__/**',
  ],
};
