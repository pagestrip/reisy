// @flow

import stringify from "./stringify.js"
import {decl} from "./types.js"
import type {PubNode, PubNodeType, PubDef, PubDecl, PubMultiDecl, PubRule, PubKeyframes, PubFont} from "./types.js"
import prefix from "inline-style-prefixer/static"
import toposort from "./toposort.js"

export type StrMap<T> = {[key: string]: ?T}

type Decl = {
  type: "decl",
  value: PubDecl,
}
export type RuleNode = {
  type: "rule",
  defs: Array<{
    parents: Array<string>,
    defs: Array<PubDef>,
  }>
}

export type NodeType =
  | Decl
  | RuleNode
  | PubKeyframes
  | PubFont

export type Node = {
  key: string,
  ns: string,
  name: string,
  deps: Array<string>,
  def: NodeType,
}

type Rule = {
  selector: string,
  def: any,
}
type RegValue = {
  type: "value",
  value: string | number | boolean,
}
type RegRule = {
  type: "rule",
  selector: string,
  className: string,
}
type RegEntry = RegValue | RegRule

class Processor {
  pretty: bool
  nodes: Array<PubNode>
  overrides: Array<PubNode>
  namespaces: StrMap<StrMap<string | number | bool>>
  registry: StrMap<RegEntry>
  rules: Array<any>

  constructor() {
    this.nodes = []
    this.overrides = []
    this.pretty = process.env.NODE_ENV !== "production"
    this.namespaces = Object.create(null)

    this.reset()
  }

  reset() {
    this.rules = []
    this.registry = Object.create(null)
  }

  resolve() {
    // 1. apply overrides
    const nodes = Object.create(null)
    registerNodes(nodes, this.nodes, false)
    registerNodes(nodes, this.overrides)

    // 2. topologically sort the nodes based on their dependencies
    const sortedNodes = toposort(nodes)

    // 3. resolve the nodes, collecting them to individual rules
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i]
      this.processNode(node)
    }

    const {rules} = this

    // 3.5: prefix all the rules
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      prefix(rule.def)
    }

    // 4. serialize the rules to css
    const css = stringify(rules, this.pretty)

    this.reset()
    return css
  }

  ClassName(node: Node) {
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

  processNode(node: Node) {
    const {registry, namespaces} = this
    const {key, ns, name, def} = node
    let value

    if (def.type === "rule") {
      const className = this.ClassName(node)
      value = {
        type: "rule",
        selector: `${node.ns ? "." : ""}${className}`,
        className,
      }
      const seen = Object.create(null)

      const {defs} = def
      for (let i = 0; i < defs.length; i++) {
        const def = defs[i]
        processParents(this, seen, value, def.parents, key)
        const rule = createRule(value.selector)
        processRule(this, rule, def.defs)
      }
    } else if (def.type === "font") {
      value = Value(this.ClassName(node))
      const family = ["fontFamily", decl(value.value)]
      // attach the font name using a temporary property here…
      def.defs.forEach(def => {
        def.unshift(family)
        processRule(this, createRule("@font-face"), def)
        def.shift()
      })
    } else if (def.type === "keyframes") {
      const n = this.ClassName(node)
      value = Value(n)
      this.processNestedRule(`@keyframes ${n}`, def.defs)
      // and then there is old webkits :-(
      this.processNestedRule(`@-webkit-keyframes ${n}`, def.defs)
    } else {
      value = Value(this.interpolate(def.value))
    }
    registry[key] = value
    if (ns) {
      const namespace = namespaces[ns] || Object.create(null)
      namespaces[ns] = namespace
      namespace[name] = value.type === "rule"
        ? value.className
        : value.value
    }
  }

  processNestedRule(name: string, defs: Array<PubDef>, _rule: ?Rule) {
    const rule = createRule(name)
    const container = _rule || createRule("")
    const rules = this.rules
    this.rules = []
    processRule(this, container, defs)
    for (let i = _rule ? 0 : 1; i < this.rules.length; i++) {
      const r = this.rules[i]
      rule.def[r.selector] = r.def
    }
    this.rules = rules
    this.rules.push(rule)
    return rule
  }

  interpolate(parts: PubDecl): string | number | boolean {
    if (typeof parts !== "object") {
      return parts
    }
    if (parts.length === 2 && !parts[0]) {
      return interpolatedValue(this.registry[parts[1]])
    }
    return parts.map((part, i) => i % 2 === 0
      ? String(part)
      : interpolatedValue(this.registry[part])
    ).join("").trim()
  }
}

export default Processor

function Value(value: string | number | boolean): RegValue {
  return {
    type: "value",
    value,
  }
}

function interpolatedValue(arg: ?RegEntry) {
  if (arg === null || typeof arg === "undefined") { return "" }
  return arg.type === "value" ? arg.value : arg.selector
}

function createRule(selector) {
  return {
    selector,
    def: Object.create(null),
  }
}

let ANONYMOUS = 0
// Converts Public Node definitions to internal Nodes
function toNodeType(_def: PubNodeType): NodeType {
  const def = (typeof _def !== "object" || Array.isArray(_def))
    ? {type: "decl", value: _def}
    : _def
  if (def.type !== "rule") { return def }
  const {parents, defs} = def
  // same as above, flow loses the type of `type` somehow
  return {
    type: "rule",
    defs: [{parents, defs}],
  }
}

function registerNodes(map: StrMap<Node>, nodes: Array<PubNode>, merge = true) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const {ns, name, deps} = node
    const key = ns ? `${ns}.${name}` : `__${ANONYMOUS++}`
    const def = toNodeType(node.def)

    if (map[key] && merge) {
      const node = map[key]
      if (def.type !== node.def.type) {
        console.error(
          new Error(`reisy: Incompatible types for node "${key}": got "${def.type}" expected "${node.def.type}".`))
        continue
      }
      // XXX: the if above actually made sure these are the same, but flow
      // doesn’t know that :-(
      if (node.def.type === "rule" && def.type === "rule") {
        node.def.defs.push(def.defs[0])
      } else {
        node.def = def
      }
      node.deps.push(...deps)
    } else {
      map[key] = {
        key,
        ns, name,
        deps: deps.slice(),
        def,
      }
    }
  }
}

function processParents(output, seen, value, parents, nodekey) {
  for (let i = 0; i < parents.length; i++) {
    const key = parents[i]
    if (seen[key]) { continue }
    seen[key] = true
    const parent = output.registry[key]
    if (parent && typeof parent.className === "string") {
      value.className = `${parent.className} ${value.className}`
    } else {
      console.error(new Error(`reisy: "${nodekey}" extends non-existant "${key}". A typo maybe?`))
    }
    seen[key] = true
  }
}

function processRule(output, rule, defs) {
  output.rules.push(rule)
  for (let i = 0; i < defs.length; i++) {
    const _def = defs[i]
    const name = output.interpolate(_def[0])
    const def = _def[1]
    const {type} = def
    if (type === "rule") {
      const {defs} = def
      if (name.startsWith("@")) {
        output.processNestedRule(name, defs, createRule(rule.selector))
        continue
      }
      const selector = rule.selector.split(",").reduce((arr, _selector) => {
        const selector = _selector.trim()
        return arr.concat(name.split(",").map(_name => {
          const name = _name.includes("&") ? _name.trim() : `& ${_name.trim()}`
          return name.replace("&", selector).trim()
        }))
      }, []).join(", ")
      processRule(output, createRule(selector), defs)
    } else {
      const value = type === "multidecl"
        ? def.values.map(value => output.interpolate(value))
        : output.interpolate(def)
      rule.def[camelify(name)] = value
    }
  }
}

function camelify(str) {
  return str
    .replace(/^-ms-/, "ms-")
    .replace(/-(\w|$)/, (_, ch) => ch.toUpperCase())
}
