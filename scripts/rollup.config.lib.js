import plugins from "./plugins.js"

export default {
  entry: "src/index.js",
  external: [
    "inline-style-prefixer/static",
  ],
  sourceMap: true,
  exports: "named",
  plugins,
  targets: [{
    dest: "index.js",
    format: "cjs",
  }],
}
