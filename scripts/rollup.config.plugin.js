import babel from "rollup-plugin-babel"
const plugins = [
  babel({
    babelrc: false,
    presets: ["es2015-rollup"],
  }),
]

export default {
  entry: "src/plugin.js",
  external: [
    "postcss",
  ],
  sourceMap: true,
  plugins,
  targets: [{
    dest: "plugin.js",
    format: "cjs",
  }],
}
