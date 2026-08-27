const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const mobileReactPath = path.dirname(require.resolve('react/package.json'));
const mobileReactRuntimePath = path.dirname(require.resolve('react/jsx-runtime'));
const mobileReactDevRuntimePath = path.dirname(require.resolve('react/jsx-dev-runtime'));

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react/package.json') {
    return { type: 'sourceFile', filePath: path.join(mobileReactPath, 'index.js') };
  }

  if (moduleName === 'react/jsx-runtime') {
    return { type: 'sourceFile', filePath: path.join(mobileReactRuntimePath, 'jsx-runtime.js') };
  }

  if (moduleName === 'react/jsx-dev-runtime') {
    return { type: 'sourceFile', filePath: path.join(mobileReactDevRuntimePath, 'jsx-dev-runtime.js') };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
