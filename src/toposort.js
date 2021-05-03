const TEMP = "temp"
const PERM = "perm"

function toposort(nodes) {
  const sorted = []
  const marks = Object.create(null)

  const keys = Object.keys(nodes)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (!marks[key]) {
      visit(sorted, nodes, marks, key)
    }
  }
  return sorted
}

function visit(sorted, nodes, marks, key) {
  const node = nodes[key]
  if (!node) {
    console.error(new Error(`reisy: Invalid dependency on "${key}". A typo maybe?`))
    return
  }
  if (marks[key] === TEMP) {
    console.warn(`reisy: Node "${key}" is part of a cyclic dependency.`)
  }
  if (marks[key]) {
    return
  }

  marks[key] = TEMP
  for (let i = 0; i < node.deps.length; i++) {
    const dep = node.deps[i]
    visit(sorted, nodes, marks, dep)
  }
  marks[key] = PERM

  sorted.push(node)
}

export default toposort
