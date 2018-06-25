#!/usr/bin/env node

const rollup = require("rollup")
const babel = require("rollup-plugin-babel")
const fs = require("fs")

const plugins = () => [
  babel({
    babelrc: false,
    presets: [
      ["env", {modules: false}],
    ],
    plugins: [
      "external-helpers",
    ],
  }),
]

function mkConfig(input, output, options) {
  const config = Object.assign({
    input,
    output: Object.assign({
      sourcemap: true,
      format: "cjs",
    }, output),
    plugins: plugins(),
  }, options)
  return config
}

const banner = `#!/usr/bin/env node

require('source-map-support').install();
`

const configs = [
  // XXX: use this via require in cli and plugin once rollup supports code
  // splitting!
  mkConfig("src/parser.js", {
    file: "parser.js",
  }, {
    external: ["postcss"],
  }),
  mkConfig("src/cli.js", {
    file: "bin/reisy.js",
    banner,
  }, {
    external: ["fs", "path", "postcss"],
  }),
  mkConfig("src/plugin.js", {
    file: "plugin.js",
  }, {
    external: ["postcss"],
  }),
  mkConfig("src/index.js", {
    file: "index.js",
    exports: "named",
  }, {
    external: path => path.includes("inline-style-prefixer/static"),
  }),
]

function runOne(config) {
  const file = config.output.file
  return rollup.rollup(config)
    .then(bundle => bundle.write(config.output))
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
