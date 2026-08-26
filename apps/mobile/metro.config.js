const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
const mobileReactPath = path.dirname(require.resolve('react/package.json', { paths: [projectRoot] }));

config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: mobileReactPath,
  'react/jsx-runtime': path.join(mobileReactPath, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(mobileReactPath, 'jsx-dev-runtime.js'),
};

module.exports = config;
