#!/usr/bin/env node

const rollup = require("rollup")
const babel = require("rollup-plugin-babel")
const fs = require("fs")

const plugins = () => [
  babel({
    babelrc: false,
    presets: [
      ["latest", {es2015: {modules: false}}],
    ],
    plugins: [
      "external-helpers",
    ],
  }),
]

function mkConfig(entry, dest, options) {
  const config = Object.assign({
    entry, dest,
    sourceMap: true,
    plugins: plugins(),
    format: "cjs",
  }, options)
  return config
}

const banner = `#!/usr/bin/env node

require('source-map-support').install();
`

const configs = [
  // XXX: use this via require in cli and plugin once rollup supports code
  // splitting!
  mkConfig("src/parser.js", "parser.js", {
    external: ["postcss"],
  }),
  mkConfig("src/cli.js", "bin/reisy.js", {
    external: ["fs", "path", "postcss"],
    banner,
  }),
  mkConfig("src/plugin.js", "plugin.js", {
    external: ["postcss"],
  }),
  mkConfig("src/index.js", "index.js", {
    external: ["inline-style-prefixer/static"],
    exports: "named",
  }),
]

function runOne(config) {
  const file = config.dest
  return rollup.rollup(config)
    .then(bundle => bundle.write(config))
    .then(res => {
      const stat = fs.statSync(file)
      const size = Math.ceil(stat.size / 1024)
      console.log(`-> ${rightpad(file, 15)}    ${leftpad(size, 4)}kiB`)
      return res
    })
}

console.time("building")
Promise.all(configs.map(runOne)).then(
  () => console.timeEnd("building"),
  err => console.error(err)
)

// fuck me, I’m copying 10 loc instead of depending on an external module!!!
// XXX: remove this once node has native String.prototype.pad{Start,End}
function leftpad(str, len, ch) {
  str = String(str)
  let i = -1
  if (!ch && ch !== 0) { ch = " " }
  len -= str.length
  while (++i < len) {
    str = ch + str
  }
  return str
}
function rightpad(str, len, ch) {
  str = String(str)
  let i = -1
  if (!ch && ch !== 0) { ch = " " }
  len -= str.length
  while (++i < len) {
    str += ch
  }
  return str
}
