/** @type {import('jest').Config} */
module.exports = {
  // Module paths to ignore - prevent Haste collisions
  modulePathIgnorePatterns: [
    '<rootDir>/__FORGEHUB/',
    '<rootDir>/dist/',
    '<rootDir>/.jest-cache/',
    '<rootDir>/shadcn-ui/'
  ],

  // Test paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__FORGEHUB/',
    '/dist/',
    '/.jest-cache/',
    '/shadcn-ui/'
  ],
  
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@angular/cdk|@angular/common|@angular/core|rxjs))'
  ],
  
  // Use projects to run tests in parallel with separate configurations
  projects: [
    {
      displayName: 'stdlib',
      testMatch: [
        '<rootDir>/src/stdlib/**/*.spec.ts',
        '<rootDir>/src/stdlib/**/*.test.ts',
        '<rootDir>/src/stdlib/**/__tests__/**/*.ts'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.spec.json'
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@angular/cdk|@angular/common|@angular/core|rxjs))'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      collectCoverageFrom: [
        'src/stdlib/**/*.ts',
        '!src/stdlib/**/*.d.ts',
        '!src/stdlib/**/index.ts',
        '!src/stdlib/**/__tests__/**'
      ],
      // Timeout inherited from global settings
    },
    {
      displayName: 'specs',
      testMatch: [
        '<rootDir>/src/specs/**/*.spec.ts',
        '<rootDir>/src/specs/**/*.test.ts',
        '<rootDir>/src/specs/**/__tests__/**/*.ts'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.spec.json'
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@angular/cdk|@angular/common|@angular/core|rxjs))'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      collectCoverageFrom: [
        'src/specs/**/*.ts',
        '!src/specs/**/*.d.ts',
        '!src/specs/**/index.ts',
        '!src/specs/**/__tests__/**'
      ]
    },
    {
      displayName: 'schematics',
      testMatch: [
        '<rootDir>/src/schematics/**/*.spec.ts',
        '<rootDir>/src/schematics/**/*.test.ts',
        '<rootDir>/src/schematics/**/__tests__/**/*.ts'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.spec.json'
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@angular/cdk|@angular/common|@angular/core|rxjs))'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      collectCoverageFrom: [
        'src/schematics/**/*.ts',
        '!src/schematics/**/*.d.ts',
        '!src/schematics/**/index.ts',
        '!src/schematics/**/__tests__/**'
      ]
    },
    {
      displayName: 'other',
      testMatch: [
        '<rootDir>/src/**/*.spec.ts',
        '<rootDir>/src/**/*.test.ts',
        '!<rootDir>/src/stdlib/**/*',
        '!<rootDir>/src/specs/**/*',
        '!<rootDir>/src/schematics/**/*'
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.spec.json'
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@angular/cdk|@angular/common|@angular/core|rxjs))'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/stdlib/**/*',
        '!src/specs/**/*',
        '!src/schematics/**/*'
      ]
    }
  ],
  
  // Global settings
  coverageReporters: ['text', 'lcov', 'html', 'json', 'json-summary'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true'
      }
    ]
  ],
  
  // Performance optimizations
  maxWorkers: '50%', // Use 50% of available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Test timeout settings - Increased for complex tests
  testTimeout: 45000, // 45 seconds per test for complex functional tests
  
  // Bail on first test failure to speed up CI
  bail: false,
  
  // Force exit after tests complete to prevent hanging
  forceExit: true,
  
  // Detect open handles that might cause hanging
  detectOpenHandles: true, // Enabled to debug hanging processes and resource cleanup issues
  
  // Detect memory leaks in tests
  detectLeaks: false, // Disabled for performance, enable when debugging leaks
  
  // Run tests in band to avoid concurrency issues (useful for debugging)
  // runInBand: true, // Uncomment when debugging resource issues
  
  // Maximum time Jest should wait for tests to finish after test run
  openHandlesTimeout: 1000, // 1 second
  
  // Coverage thresholds - Achieved 70.78% coverage as of 2025-08-07
  // These thresholds ensure we maintain our hard-won coverage levels
  coverageThreshold: {
    global: {
      branches: 65,    // Current: 65.23% - slightly below target but acceptable
      functions: 68,   // Current: 68.92% - close to 70% target
      lines: 70,       // Current: 70.78% - meets target!
      statements: 70   // Current: 70.45% - meets target!
    }
  }
};