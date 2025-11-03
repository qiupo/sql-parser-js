/**
 * Jest Configuration
 *
 * Configuration for running unit tests, integration tests,
 * and performance benchmarks
 */

module.exports = {
  // Test environment
  testEnvironment: "node",

  // Transform configuration for ES modules
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },

  // Module name mapping for ES modules
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.js",
    "**/__tests__/**/*.js",
    "**/*.(test|spec).js",
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/__tests__/**",
    "!**/node_modules/**",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test setup
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Verbose output
  verbose: true,

  // Test timeout (increased for performance tests)
  testTimeout: 30000,

  // Reporter configuration
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./coverage/html-report",
        filename: "report.html",
        expand: true,
      },
    ],
  ],

  // Performance test configuration
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Watch mode configuration
  watchPathIgnorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/dist/",
    "/build/",
  ],

  // Custom test categories
  projects: [
    {
      displayName: "unit",
      testMatch: ["**/tests/lexer.test.js", "**/tests/parser.test.js", "**/tests/comprehensive-sql.test.js", "**/tests/complex-queries.test.js"],
      testTimeout: 10000,
    },
    {
      displayName: "integration",
      testMatch: ["**/tests/integration.test.js"],
      testTimeout: 15000,
    },
    {
      displayName: "performance",
      testMatch: ["**/tests/performance.test.js"],
      testTimeout: 60000,
      // Disable coverage for performance tests to avoid overhead
      collectCoverage: false,
    },
  ],
};
