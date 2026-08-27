const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
const mobileReact = path.resolve(mobileNodeModules, 'react');

// Preserve normal Expo/Metro package lookup, but keep every React entrypoint
// on the mobile app's React 19.0.0 installation. This avoids React being
// loaded twice when the workspace also contains Prisma Studio's React 19.2.8.
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  react: mobileReact,
  'react/jsx-runtime': path.resolve(mobileReact, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.resolve(mobileReact, 'jsx-dev-runtime.js'),
};

module.exports = config;
