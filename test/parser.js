import {reisy} from "../src/"
import {transform} from "babel-core"
import {expect} from "chai"
import plugin from "../src/plugin.js"
import parser from "../src/parser.js"
import fs from "fs"
import path from "path"

// XXX: jut a hack because default and named exports do not play well together
// in rollup
const {fromCSS, toCSS} = parser

const TESTCASES = path.join(__dirname, "parsertests")

const opts = {
  plugins: [plugin],
}

function parsePlugin(str) {
  const {code} = transform(`function a() {}a\`\`; const output = reisy\`${str}\`;`, opts)
  // eslint-disable-next-line no-new-func
  ;(new Function("reisy", `${code} return output`))(reisy)
  const nodes = reisy._processor.nodes
  reisy.reset()
  return nodes
}

function createTest(dir) {
  const base = path.join(TESTCASES, dir)
  const read = file => fs.readFileSync(path.join(base, file), "utf-8")
  const meta = JSON.parse(read("meta.json"))
  const name = meta.name || dir
  if (meta.skip) {
    it.skip(name)
    return
  }

  const plugin = meta.plugin !== false
  it(name, () => {
    // parse input
    const input = read("input.css")
    const {nodes} = parser(input)
    if (plugin) {
      expect(parsePlugin(input)).to.eql(nodes)
    }

    // parse overrides
    let overrides = []
    try {
      const input = read("overrides.css")
      overrides = parser(input).nodes
      if (plugin) {
        expect(parsePlugin(input)).to.eql(overrides)
      }
    } catch (e) {}

    let expected = ""
    try {
      expected = read("expected.css").trim()
    } catch (e) {}

    // collect errors
    const error = console.error
    const errors = []
    console.error = err => errors.push(err.message)

    // initiaze and run reisy
    reisy.nodes(nodes)
    reisy.overrides(overrides)
    reisy.pretty(true)

    if (meta.prefix) {
      reisy.prefix(meta.prefix)
    }

    const output = reisy.resolve()

    // assert that generating reisy-flavored css from the nodes and re-parsing
    // it generates the same nodes/overrides
    let rcss = toCSS(nodes)
    expect(fromCSS(rcss).nodes).to.eql(nodes)
    rcss = toCSS(overrides)
    expect(fromCSS(rcss).nodes).to.eql(overrides)

    // assert output and namespaces
    expect(output).to.eql(expected)
    Object.keys(meta.namespaces || {}).forEach(ns => {
      expect(reisy.namespace(ns)).to.eql(meta.namespaces[ns])
    })
    expect(errors).to.eql(meta.errors || [])

    // assert minified output / namespaces
    expected = ""
    try {
      expected = read("expected.min.css").trim()
    } catch (e) {}
    if (expected || meta.namespaces_min) {
      reisy.reset()
      reisy.nodes(nodes)
      reisy.overrides(overrides)
      reisy.pretty(false)
      const output = reisy.resolve()

      expect(output).to.eql(expected)
      Object.keys(meta.namespaces_min || {}).forEach(ns => {
        expect(reisy.namespace(ns)).to.eql(meta.namespaces_min[ns])
      })
    }

    console.error = error
  })
}

describe("Parser/Plugin", () => {
  const cases = fs.readdirSync(TESTCASES)
    .filter(f => !f.startsWith("."))
  const error = console.error
  afterEach(() => {
    console.error = error
    reisy.reset()
  })
  cases.forEach(createTest)
})
