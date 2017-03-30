export default function stringifyRules(rules, processSelector, pretty) {
  const NL = pretty ? "\n" : "" // newline
  const lines = []
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    stringifyRule(pretty, processSelector, lines, rule.selector, rule.def)
  }
  return lines.join(NL)
}

function stringifyRule(pretty, processSelector, lines, selector, defs, indent = "") {
  const IND = pretty ? "  " : "" // indent
  const SP = pretty ? " " : "" // space
  const chindent = `${indent}${IND}`
  const keys = Object.keys(defs)
  if (!keys.length) { return }
  lines.push(`${indent}${processSelector(selector)}${SP}{`)
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
      stringifyRule(pretty, processSelector, lines, name, value, chindent)
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
