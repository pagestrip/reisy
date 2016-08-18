import stringify from "./stringify.js"
import {decl} from "./types.js"
import prefix from "inline-style-prefixer/static"
import toposort from "./toposort.js"

class Processor {
  constructor({_nodes, _overrides, _namespaces, _pretty}) {
    this.nodes = _nodes
    this.overrides = _overrides
    this.namespaces = _namespaces
    this.pretty = _pretty
    this.rules = []
    this.registry = Object.create(null)
  }

  resolve() {
    // 1. apply overrides
    let nodes = Object.create(null)
    registerNodes(nodes, this.nodes, false)
    registerNodes(nodes, this.overrides)

    // 2. topologically sort the nodes based on their dependencies
    nodes = toposort(nodes)

    // 3. resolve the nodes, collecting them to individual rules
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      processNode(this, node)
    }

    const {rules} = this

    // 3.5: prefix all the rules
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      prefix(rule.def)
    }

    // 4. serialize the rules to css
    const css = stringify(rules, this.pretty)

    return css
  }
}

function ClassName({pretty}, node) {
  const {ns, name} = node
  if (!ns) {
    return name
  }
  const className = `${ns}-${name}`
  if (pretty) {
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

function processNode(output, node) {
  const {key, ns, name, def} = node
  const {type} = def
  const {registry, namespaces} = output
  let value

  if (type === "rule") {
    const className = ClassName(output, node)
    value = {
      selector: `${node.ns ? "." : ""}${className}`,
      className,
    }
    const seen = Object.create(null)

    const {defs} = def
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i]
      processParents(output, seen, value, def.parents, key)
      const rule = createRule(value.selector)
      processRule(output, rule, def.defs)
    }
  } else if (type === "font") {
    value = ClassName(output, node)
    // attach the font name using a temporary property here…
    def.defs.forEach(def => {
      def.unshift(["fontFamily", decl(value)])
      processRule(output, createRule("@font-face"), def)
      def.shift()
    })
  } else if (type === "keyframes") {
    value = ClassName(output, node)
    processNestedRule(output, `@keyframes ${value}`, def.defs)
    // and then there is old webkits :-(
    processNestedRule(output, `@-webkit-keyframes ${value}`, def.defs)
  } else {
    value = interpolate(registry, def.value)
  }
  registry[key] = value
  if (ns) {
    if (!namespaces[ns]) {
      namespaces[ns] = Object.create(null)
    }
    namespaces[ns][name] = (value && typeof value === "object")
      ? value.className
      : value
  }
  return value
}

function processParents(output, seen, value, parents, nodekey) {
  for (let i = 0; i < parents.length; i++) {
    const key = parents[i]
    if (seen[key]) { continue }
    seen[key] = true
    const parent = output.registry[key]
    if (parent) {
      value.className = `${parent.className} ${value.className}`
    } else {
      console.error(new Error(`reisy: "${nodekey}" extends non-existant "${key}". A typo maybe?`))
    }
    seen[key] = true
  }
}

function createRule(selector) {
  return {
    selector,
    def: Object.create(null),
  }
}

function processNestedRule(output, name, defs, _rule) {
  const rule = createRule(name)
  const container = _rule || createRule("")
  const rules = output.rules
  output.rules = []
  processRule(output, container, defs)
  for (let i = _rule ? 0 : 1; i < output.rules.length; i++) {
    const r = output.rules[i]
    rule.def[r.selector.substring(_rule ? 0 : 1)] = r.def
  }
  output.rules = rules
  output.rules.push(rule)
  return rule
}

function processRule(output, rule, defs) {
  output.rules.push(rule)
  for (let i = 0; i < defs.length; i++) {
    const _def = defs[i]
    const name = interpolate(output.registry, _def[0])
    const def = _def[1]
    const {type} = def
    if (type === "rule") {
      const {defs} = def
      if (name.startsWith("@")) {
        processNestedRule(output, name, defs, createRule(rule.selector))
        continue
      }
      const selector = rule.selector.split(",").reduce((arr, _selector) => {
        const selector = _selector.trim()
        return arr.concat(name.split(",").map(_name => {
          const name = _name.trim()
          return name.startsWith("&")
            ? `${selector}${name.substring(1)}`
            : `${selector} ${name}`
        }))
      }, []).join(", ")
      processRule(output, createRule(selector), defs)
    } else {
      const value = type === "multidecl"
        ? def.values.map(value => interpolate(output.registry, value))
        : interpolate(output.registry, def)
      rule.def[camelify(name)] = value
    }
  }
}

function interpolate(registry, parts) {
  if (typeof parts !== "object") {
    return parts
  }
  if (parts.length === 2 && !parts[0]) {
    return noundef(registry[parts[1]])
  }
  return parts.map((part, i) => i % 2 === 0
    ? String(part)
    : noundef(registry[part])
  ).join("").trim()
}

function noundef(arg) {
  return typeof arg === "undefined" ? "" : arg
}

function camelify(str) {
  return str
    .replace(/^-ms-/, "ms-")
    .replace(/-(\w|$)/, (_, ch) => ch.toUpperCase())
}
