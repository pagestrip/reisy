const __DEV__ = process.env.NODE_ENV !== "production"
// pretty print settings
const IND = __DEV__ ? "  " : "" // indent
const NL = __DEV__ ? "\n" : "" // newline
const SP = __DEV__ ? " " : "" // space

export const ClassName = node => {
  const {ns, name} = node
  if (!ns) {
    return name
  }
  const className = `${ns}-${name}`
  if (__DEV__) {
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

export function stringifyRules(rules) {
  const lines = []
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    stringifyRule(lines, rule.selector, rule.def)
  }
  return lines.join(NL)
}

function stringifyRule(lines, selector, defs, indent = "") {
  const chindent = `${indent}${IND}`
  const keys = Object.keys(defs)
  if (!keys.length) { return }
  lines.push(`${indent}${selector}${SP}{`)
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i]
    const value = defs[name]
    const prop = dashify(name)
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const val = value[i]
        lines.push(`${chindent}${prop}:${SP}${val};`)
      }
    } else if (typeof value === "object") {
      stringifyRule(lines, name, value, chindent)
    } else {
      lines.push(`${chindent}${prop}:${SP}${value};`)
    }
  }
  lines.push(`${indent}}`)
}

function dashify(str) {
  return str
    .replace(/([A-Z])/g, "-$1")
    .replace(/^ms-/, "-ms-")
    .toLowerCase()
}
