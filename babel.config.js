module.exports = function (api) {
  api.cache(true);
  let plugins = []

  plugins.push('react-native-reanimated/plugin');
  plugins.push('@babel/plugin-transform-dynamic-import');

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
