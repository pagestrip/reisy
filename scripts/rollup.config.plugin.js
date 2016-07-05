export default {
  entry: 'src/plugin/index.js',
  external: [
    'postcss',
    'inline-style-prefix-all',
  ],
  sourceMap: true,
  targets: [{
    dest: 'plugin.js',
    format: 'cjs',
  }],
};
