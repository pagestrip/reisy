import {node} from "./types.js"
import Processor from "./process.js"

class Reisy {
  constructor() {
    this.reset()
  }

  reset() {
    this._nodes = []
    this._overrides = []
    this._namespaces = Object.create(null)
    this._listeners = new Set()
    this._pretty = process && process.env.NODE_ENV !== "production"
    return this
  }

  pretty(pretty) {
    this._pretty = pretty
  }

  notify() {
    this._listeners.forEach(listener => listener(this))
  }
  on(listener) {
    this._listeners.add(listener)
    return this
  }
  off(listener) {
    this._listeners.delete(listener)
    return this
  }

  node(...args) {
    this._nodes.push(node(...args))
    this.notify()
    return this
  }

  nodes(nodes) {
    this._nodes = this._nodes.concat(nodes)
    this.notify()
    return this
  }

  namespace(name) {
    if (!name) { return null }
    const ns = this._namespaces[name] || Object.create(null)
    this._namespaces[name] = ns
    return ns
  }

  overrides(overrides) {
    this._overrides = overrides
    this.notify()
    return this
  }

  resolve() {
    const processor = new Processor(this)
    return processor.resolve()
  }
}

export default Reisy
