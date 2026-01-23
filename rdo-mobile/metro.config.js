const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

// 1. Get default Expo config
const config = getDefaultConfig(__dirname);

// 2. Enable NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
