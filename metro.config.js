const { withNativewind } = require("nativewind/metro");
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Sentry 8.28 probes a Router store removed in SDK 58. Its existing
// null fallback disables this optional integration when the module is absent.
const { existsSync } = require("node:fs");
const { dirname, join } = require("node:path");
const hasLegacyRouterStore = existsSync(
  join(dirname(require.resolve("expo-router/package.json")), "build/global-state/router-store.js"),
);
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    !hasLegacyRouterStore &&
    moduleName === "expo-router/build/global-state/router-store" &&
    context.originModulePath.replace(/\\/g, "/").includes("/@sentry/react-native/")
  ) {
    return { type: "empty" };
  }

  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: true,
});