/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/index.ts',
    // timeseries.ts: testes pendentes em SPEC-0034
    '!src/timeseries.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 95,
      functions: 95,
      branches: 90,
      statements: 95,
    },
  },
};
