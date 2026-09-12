module.exports = {
  rootDir: __dirname,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts', 'cjs'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/test-mocks/expo-secure-store.cjs',
    '^@react-native-async-storage/async-storage$': '<rootDir>/test-mocks/async-storage.cjs',
  },
};
