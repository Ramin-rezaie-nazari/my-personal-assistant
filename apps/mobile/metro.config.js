const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Keep the mobile app on its own React installation while preserving
// Metro's normal hierarchical lookup for Expo packages such as
// @expo/metro-runtime.
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  react: path.resolve(mobileNodeModules, 'react'),
};

module.exports = config;
