const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Keep native app resolution inside the mobile workspace.
// Backend/web tooling (notably Prisma Studio) has its own React version
// and must never leak into the native bundle.
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Explicitly pin React to the app's React 19.0.0 installation.
config.resolver.extraNodeModules = {
  react: path.resolve(mobileNodeModules, 'react'),
};

module.exports = config;
