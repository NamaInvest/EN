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
  // Test patterns — includes src/ AND tests/ directories
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '!**/__tests__/api/financial-integration.test.ts', // Needs live server — run with npm run test:e2e
    '!**/tests/e2e/**',  // E2E runs via Playwright, not Jest
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
      branches:   60,   // raised from 50
      functions:  60,   // raised from 50
      lines:      60,   // raised from 50
      statements: 60,   // raised from 50
    },
  },
  // Separate projects for different test categories
  projects: [
    {
      displayName:    'unit',
      testEnvironment: 'node',
      testMatch:      ['<rootDir>/src/**/*.test.ts', '!<rootDir>/src/__tests__/api/**'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transform:      { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: false }] },
    },
    {
      displayName:    'react',
      testEnvironment: 'jsdom',
      testMatch:      ['<rootDir>/src/**/*.test.tsx'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
    {
      // Domain tests: /tests/*.test.ts (budget, cash-flow, GOSI, etc.)
      displayName:    'domain',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/*.test.ts',
        '<rootDir>/tests/unit/**/*.test.ts',
        '<rootDir>/tests/a11y/**/*.test.ts',
      ],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transform:      { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
    },
    {
      // Integration tests: /tests/integration/*.test.ts
      displayName:    'integration',
      testEnvironment: 'node',
      testMatch:      ['<rootDir>/tests/integration/**/*.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transform:      { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
      testTimeout:    30_000,  // Integration tests may take longer
    },
  ],
}

export default createJestConfig(config)
