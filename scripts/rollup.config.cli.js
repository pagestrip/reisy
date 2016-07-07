import babel from "rollup-plugin-babel"
const plugins = [
  babel({
    babelrc: false,
    presets: ["es2015-rollup"],
  }),
]

const banner = `#!/usr/bin/env node

require('source-map-support').install();
`

export default {
  entry: "src/cli.js",
  external: [
    "fs", "path",
    "postcss",
    "source-map-support",
  ],
  sourceMap: true,
  banner,
  plugins,
  targets: [{
    dest: "bin/reisy.js",
    format: "cjs",
  }],
}