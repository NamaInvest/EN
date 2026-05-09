import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment:  'node',           // node env for API tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '!**/__tests__/api/financial-integration.test.ts', // Needs live server — run with npm run test:e2e
  ],
  // Coverage configuration
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/services/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches:   50,
      functions:  50,
      lines:      50,
      statements: 50,
    },
  },
  // Separate project for integration tests
  projects: [
    {
      displayName:    'unit',
      testEnvironment: 'node',
      testMatch:      ['<rootDir>/src/**/*.test.ts', '!<rootDir>/src/__tests__/api/**'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transform:      { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }] },
    },
    {
      displayName:    'react',
      testEnvironment: 'jsdom',
      testMatch:      ['<rootDir>/src/**/*.test.tsx'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
}

export default createJestConfig(config)
