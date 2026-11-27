module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.prueba.tsx'],
  resolver: 'react-native-reanimated/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/pruebas/configurar-jest.js'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
