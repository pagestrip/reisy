import babel from "rollup-plugin-babel"
const plugins = [
  babel({
    babelrc: false,
    presets: ["es2015-rollup"],
  }),
]

export default {
  entry: "src/index.js",
  external: [
    "inline-style-prefix-all",
  ],
  sourceMap: true,
  exports: "named",
  plugins,
  targets: [{
    dest: "index.js",
    format: "cjs",
  }],
}
