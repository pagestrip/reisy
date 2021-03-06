import stringify from "./stringify.js"
import {decl} from "./types.js"
import prefix from "./prefix.js"
import toposort from "./toposort.js"

const RRMATCH = /(__rreq__[0-9]+)/g

class Processor {
  constructor() {
    this.nodes = []
    this.overrides = []
    this.namespaces = {}
    this.pretty = process.env.NODE_ENV !== "production"
    this.prefix = ""
    this.rules = null
    this.registry = null
    this.registryRequests = []
    this.registryRequestCount = 0
  }

  resolve() {
    this.rules = []
    this.registry = {}
    this.registryRequests = []

    // 1. apply overrides
    let nodes = {}
    registerNodes(nodes, this.nodes, false)
    registerNodes(nodes, this.overrides)

    // 2. topologically sort the nodes based on their dependencies
    nodes = toposort(nodes)

    // 3. resolve the nodes, collecting them to individual rules
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      this.processNode(node)
    }

    const {rules} = this

    // 3.5: prefix all the rules and resolve open registry requests
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      rule.selector = rule.selector.replace(RRMATCH, m => interpolatedValue(this.registry[this.registryRequests[m]]))
      Object.keys(rule.def).forEach(k => {
        const nk = k.replace(RRMATCH, m => interpolatedValue(this.registry[this.registryRequests[m]]))
        if (nk !== k) {
          rule.def[nk] = rule.def[k]
          delete rule.def[k]
        }
      })
      rule.def = prefix(rule.def)
    }

    // 4. serialize the rules to css
    const css = stringify(rules, this.prefixSelector.bind(this), this.pretty)

    return css
  }

  prefixSelector(selector) {
    if (!this.prefix || selector.match(/^(\d|@).*/)) { return selector }
    return selector.split(",").map(selector =>
      `${this.prefix} ${selector.trim()}`.trim()).join(", ")
  }

  ClassName(node) {
    const {ns, name} = node
    if (!ns) {
      return name
    }
    const className = `${ns}-${name}`
    if (this.pretty) {
      return className
    }

    // create a tiny hash of the className, just to save some bytes :-)
    let value = 5381
    let i = className.length

    while (i) {
      value = (value * 33) ^ className.charCodeAt(--i)
    }

    return `_${(value >>> 0).toString(36)}`
  }

  interpolate(parts) {
    if (typeof parts !== "object") {
      return parts
    }
    if (parts.length === 2 && !parts[0]) {
      return interpolatedValue(this.registry[parts[1]])
    }
    return parts.map((part, i) => i % 2 === 0
      ? String(part)
      : interpolatedValue(this.getFromRegistry(part))
    ).join("").trim()
  }

  getFromRegistry(key) {
    const data = this.registry[key]
    if (data === undefined) {
      this.registryRequestCount++
      const value = `__rreq__${this.registryRequestCount}`
      this.registryRequests[value] = key
      return {value}
    }
    return data
  }

  processNode(node) {
    const {key, ns, name, def} = node
    const {type} = def
    const {registry, namespaces} = this
    let value

    if (type === "rule") {
      const className = this.ClassName(node)
      value = {
        type: "rule",
        selector: `${node.ns ? "." : ""}${className}`,
        className,
      }
      const seen = {}

      const {defs} = def
      for (let i = 0; i < defs.length; i++) {
        const def = defs[i]
        this.processParents(seen, value, def.parents, key)
        const rule = createRule(value.selector)
        this.processRule(rule, def.defs)
      }
    } else if (type === "font") {
      value = this.ClassName(node)
      const family = ["fontFamily", decl(value)]
      // attach the font name using a temporary property here…
      def.defs.forEach(def => {
        def.unshift(family)
        this.processRule(createRule("@font-face"), def)
        def.shift()
      })
      value = Value(value)
    } else if (type === "keyframes") {
      value = this.ClassName(node)
      this.processNestedRule(`@keyframes ${value}`, def.defs)
      // and then there is old webkits :-(
      this.processNestedRule(`@-webkit-keyframes ${value}`, def.defs)
      value = Value(value)
    } else {
      value = Value(this.interpolate(def.value))
    }
    registry[key] = value
    if (ns) {
      if (!namespaces[ns]) {
        namespaces[ns] = {}
      }
      namespaces[ns][name] = value.type === "rule"
        ? value.className
        : value.value
    }
    return value
  }

  processParents(seen, value, parents, nodekey) {
    for (let i = 0; i < parents.length; i++) {
      const key = parents[i]
      if (seen[key]) { continue }
      seen[key] = true
      const parent = this.registry[key]
      if (parent) {
        value.className = `${parent.className} ${value.className}`
      } else {
        console.error(new Error(`reisy: "${nodekey}" extends non-existant "${key}". A typo maybe?`))
      }
      seen[key] = true
    }
  }

  processNestedRule(name, defs, _rule) {
    const rule = createRule(name)
    const container = _rule || createRule("")
    const rules = this.rules
    this.rules = []
    this.processRule(container, defs)
    for (let i = _rule ? 0 : 1; i < this.rules.length; i++) {
      const r = this.rules[i]
      rule.def[r.selector] = r.def
    }
    this.rules = rules
    this.rules.push(rule)
    return rule
  }

  processRule(rule, defs) {
    this.rules.push(rule)
    for (let i = 0; i < defs.length; i++) {
      const _def = defs[i]
      const name = this.interpolate(_def[0])
      const def = _def[1]
      const {type} = def
      if (type === "rule") {
        const {defs} = def
        if (name.startsWith("@")) {
          this.processNestedRule(name, defs, createRule(rule.selector))
          continue
        }
        const selector = rule.selector.split(",").reduce((arr, _selector) => {
          const selector = _selector.trim()
          return arr.concat(name.split(",").map(_name => {
            const name = _name.includes("&") ? _name.trim() : `& ${_name.trim()}`
            return name.replace("&", selector).trim()
          }))
        }, []).join(", ")
        this.processRule(createRule(selector), defs)
      } else {
        const value = type === "multidecl"
          ? def.values.map(value => this.interpolate(value))
          : this.interpolate(def)
        rule.def[camelify(name)] = value
      }
    }
  }
}

let ANONYMOUS = 0
function registerNodes(map, nodes, merge = true) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const {ns, name, deps, def} = node
    const key = ns ? `${ns}.${name}` : `__${ANONYMOUS++}`

    if (map[key] && merge) {
      const node = map[key]
      const newdef = processTypeDef(def, node.def, key)
      if (typeof newdef !== "undefined") {
        node.def = newdef
      }
      node.deps.push(...deps)
    } else {
      map[key] = {
        key,
        ns, name,
        deps: deps.slice(),
        def: processTypeDef(def),
      }
    }
  }
  return map
}

function processTypeDef(_def, olddef, key) {
  const def = (typeof _def !== "object" || Array.isArray(_def))
    ? {type: "decl", value: _def}
    : _def
  const {type} = def
  if (olddef && type !== olddef.type) {
    console.error(
      new Error(`reisy: Incompatible types for node "${key}": got "${type}" expected "${olddef.type}".`))
    return
  }
  if (type !== "rule") { return def }
  const {parents, defs} = def
  const _defs = {parents, defs}
  if (olddef) {
    olddef.defs.push(_defs)
    return olddef
  }
  return {
    type,
    defs: [_defs],
  }
}

export default Processor

function createRule(selector) {
  return {
    selector,
    def: {},
  }
}

function Value(value) {
  return {
    type: "value",
    value,
  }
}

function interpolatedValue(arg) {
  if (typeof arg === "undefined") { return "" }
  return arg.type === "rule"
    ? arg.selector
    : arg.value
}

function camelify(str) {
  return str
    .replace(/^-ms-/, "ms-")
    .replace(/-(\w|$)/, (_, ch) => ch.toUpperCase())
}
