export function decl(...value) {
  if (value.length === 1) {
    return value[0]
  }
  return value
}

export function multidecl(...values) {
  return {
    type: "multidecl",
    values,
  }
}

export function rule(defs, parents = []) {
  return {
    type: "rule",
    defs,
    parents,
  }
}

export function keyframes(defs) {
  return {
    type: "keyframes",
    defs,
  }
}

export function font(...defs) {
  return {
    type: "font",
    defs,
  }
}

export function node(ns, name, deps, def) {
  return {
    ns, name,
    deps, def,
  }
}
