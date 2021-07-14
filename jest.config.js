module.exports = {
  testMatch: [
    '<rootDir>/test/unit/**/*.test.js',
    '<rootDir>/test/acceptance/**/*.test.js',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/test/.*fixtures/*'
  ],
};
