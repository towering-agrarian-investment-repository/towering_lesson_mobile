const { getDefaultConfig } = require("expo/metro-config");
const { withReactNativeCSS } = require("react-native-css/metro");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withReactNativeCSS(config, {
  inlineVariables: false,
  globalClassNamePolyfill: true,
});
