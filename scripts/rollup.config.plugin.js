import plugins from "./plugins.js"

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
