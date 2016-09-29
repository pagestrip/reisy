export default function toCSS(nodes) {
  const lines = []
  let _ns = ""

  for (let i = 0; i < nodes.length; i++) {
    const {ns, name, def} = nodes[i]
    if (_ns !== ns) {
      _ns = ns
      lines.push(`\n@namespace ${ns};`)
    }
    stringifyDef(lines, name, def)
  }
  return lines.join("\n")
}

function stringifyDef(lines, name, def, indent = "") {
  if (typeof def !== "object" || Array.isArray(def)) {
    const _name = stringifyInterpolation(name)
    const value = stringifyInterpolation(def)
    lines.push(`${indent}${_name}: ${value};`)
  } else if (def.type === "multidecl") {
    def.values.forEach(def => stringifyDef(lines, name, def, indent))
  } else if (def.type === "font") {
    const _name = `@font-face ${name}`
    def.defs.forEach(defs => stringifyDef(lines, _name, {defs}, indent))
  } else {
    const {type, defs} = def
    const _name = type === "keyframes"
      ? `@keyframes ${name}`
      : stringifyInterpolation(name)
    lines.push(`${indent}${_name} {`)
    if (type === "rule" && def.parents.length) {
      lines.push(`${indent}  @extends ${def.parents.join(", ")};`)
    }
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i]
      stringifyDef(lines, def[0], def[1], `${indent}  `)
    }
    lines.push(`${indent}}`)
  }
}

function stringifyInterpolation(def) {
  if (!Array.isArray(def)) {
    return String(def)
  }
  return def.map((val, i) => String(i % 2 ? `$(${val})` : val)).join("")
}
