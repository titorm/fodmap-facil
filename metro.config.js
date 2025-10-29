const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add SQL files as asset extensions so they can be imported
config.resolver.assetExts.push('sql');

module.exports = config;
