import parser from "./parser.js"

export default function reisy({types: t}) {
  function valueToAst(val) {
    if (typeof val === "string") {
      return t.stringLiteral(val)
    }
    if (typeof val === "number") {
      return t.numericLiteral(val)
    }
    if (typeof val === "boolean") {
      return t.booleanLiteral(val)
    }
    if (Array.isArray(val)) {
      const elems = []
      for (let i = 0; i < val.length; i++) {
        elems.push(valueToAst(val[i]))
      }
      return t.arrayExpression(elems)
    }
    const props = []
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = val[key]
      props.push(t.objectProperty(t.identifier(key), valueToAst(value)))
    }
    return t.objectExpression(props)
  }

  function createReisyCalls(parsed) {
    const {namespace, nodes} = parsed
    const reisyNodes = t.memberExpression(
      t.identifier("reisy"),
      t.identifier("nodes"))
    const callNodes = t.callExpression(reisyNodes, [valueToAst(nodes)])
    const reisyNamespace = t.memberExpression(
      t.identifier("reisy"),
      t.identifier("namespace"))
    const callNamespace = t.callExpression(
      reisyNamespace,
      [t.stringLiteral(namespace)])

    return [callNodes, callNamespace]
  }

  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (!t.isIdentifier(path.node.tag, {name: "reisy"})) {
          return
        }
        let source = path.get("quasi").getSource()
        source = source.substring(1, source.length - 1)
        const parsed = parser(source)
        path.replaceWithMultiple(createReisyCalls(parsed))
      },
    },
  }
}
