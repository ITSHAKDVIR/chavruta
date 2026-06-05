module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated 4.x with new architecture (SDK 56+)
      // Must be listed LAST.
      'react-native-worklets/plugin',
    ],
  };
};
