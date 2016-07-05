export default {
  entry: "src/index.js",
  external: [
    "inline-style-prefix-all",
  ],
  sourceMap: true,
  exports: "named",
  targets: [{
    dest: "index.js",
    format: "cjs",
  }],
}
