import parser from "./parser.js"

export default function reisy({types: t}) {
  function createReisyCalls(parsed) {
    const {namespace, nodes} = parsed
    const reisyNodes = t.memberExpression(
      t.identifier("reisy"),
      t.identifier("nodes"))
    const callNodes = t.callExpression(reisyNodes, [t.valueToNode(nodes)])
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
