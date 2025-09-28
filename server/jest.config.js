module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.js", "**/tests/**/*.test.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "**/*.js",
    "!index.js",
    "!jest.config.js",
    "!scripts/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**"
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTestEnv.js"]
};
