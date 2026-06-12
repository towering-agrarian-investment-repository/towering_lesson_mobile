const { getDefaultConfig } = require("expo/metro-config");
const { withReactNativeCSS } = require("react-native-css/metro");
const path = require("path");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return {
      filePath: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
      type: "sourceFile",
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withReactNativeCSS(config, {
  inlineVariables: false,
  globalClassNamePolyfill: true,
});
