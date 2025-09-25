export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^../src/(.*)$': '<rootDir>/src/$1',
    '^../components/(.*)$': '<rootDir>/components/$1',
    '^../services/(.*)$': '<rootDir>/services/$1',
    '^../types$': '<rootDir>/types',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};