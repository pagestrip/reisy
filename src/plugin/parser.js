import {decl, multidecl, rule, keyframes/*, font*/, node} from "../types.js"
import postcss from "postcss"

// TODO:
// * handle fonts

export default function parse(source) {
  const root = postcss.parse(source)
  const converted = convertRoot(root)
  return converted
}

function convertRoot(root) {
  let ns = ""
  // let fonts = Object.create(null);
  const nodes = []
  for (let i = 0; i < root.nodes.length; i++) {
    const n = root.nodes[i]
    const {type} = n
    const global = {
      deps: new Set(),
      ns,
    }
    if (type === "atrule" && n.name === "namespace") {
      ns = n.params || ""
      continue
    }

    if (type === "comment") {
      continue
    }

    let name
    let value = convertNode(global, n)
    if (type === "decl") {
      name = n.prop
    } else if (type === "rule") {
      name = n.selectors.join(", ")

    // this is guaranteed to be an atrule!
    } else if (n.name === "keyframes") {
      name = n.params
      value = keyframes(value.defs)
    } else {
      // TODO: handle fonts
    }
    nodes.push(node(ns, name, [...global.deps], value))
  }
  return {
    namespace: ns,
    nodes,
  }
}

function nodeName(n) {
  const {type} = n
  if (type === "decl") {
    return n.prop
  }
  if (type === "atrule") {
    return `@${n.name} ${n.params}`
  }
  return n.selectors.join(", ")
}

function convertNode(global, node) {
  const {type} = node
  if (type === "decl") {
    let value = processInterpolation(global, `${node.value}${node.important ? " !important" : ""}`)
    if (value === "true") {
      value = true
    } else if (value === "false") {
      value = false
    } else {
      const parsed = parseFloat(value)
      if (String(parsed) === value) {
        value = parsed
      }
    }
    return decl(value)
  }
  // it must be a rule or atrule
  const defs = []
  const parents = []
  const defMap = Object.create(null)
  for (let i = 0; i < node.nodes.length; i++) {
    const n = node.nodes[i]
    if (n.type === "comment") {
      continue
    }
    if (n.type === "atrule" && n.name === "extends") {
      const params = n.params.split(",")
      for (let i = 0; i < params.length; i++) {
        const name = params[i].trim()
        parents.push(makeDep(global, name))
      }
      continue
    }
    const name = processInterpolation(global, nodeName(n))
    const value = convertNode(global, n)
    if (typeof defMap[name] === "undefined") {
      const idx = defs.push([name, value]) - 1
      defMap[name] = idx
    } else {
      const idx = defMap[name]
      const old = defs[idx][1]
      if (old.type === "multidecl") {
        old.values.push(value)
      } else {
        defs[idx][1] = multidecl(old, value)
      }
    }
  }
  return rule(defs, parents)
}

function makeDep(global, str) {
  const dep = str.includes(".")
    ? str
    : `${global.ns}.${str}`
  global.deps.add(dep)
  return dep
}

const RE_INTERP = /\$\(?(\w+(?:\.\w+)?)([^\w])?/g
function processInterpolation(global, str) {
  const frags = []
  let match
  let lastIndex = 0
  while ((match = RE_INTERP.exec(str))) {
    frags.push(str.substring(lastIndex, match.index))
    frags.push(makeDep(global, match[1]))
    lastIndex = match.index + match[0].length - (!match[2] || match[2] === ")" ? 0 : 1)
  }
  if (!lastIndex) {
    return str
  }
  if (lastIndex !== str.length) {
    frags.push(str.substring(lastIndex))
  }
  return frags
}
