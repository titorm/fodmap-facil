module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/engine/**/__tests__/**/*.test.ts'],
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
    'src/engine/**/*.ts',
    '!src/engine/**/*.test.ts',
    '!src/engine/**/__tests__/**',
  ],
};
