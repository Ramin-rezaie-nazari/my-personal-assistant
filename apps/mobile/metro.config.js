const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const mobileReactPath = path.dirname(require.resolve('react/package.json'));

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: mobileReactPath,
};

module.exports = config;
