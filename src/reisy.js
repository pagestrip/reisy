import {node} from "./types.js"
import Processor from "./process.js"

class Reisy {
  constructor() {
    this.reset()
  }

  reset() {
    this._processor = new Processor()
    this._listeners = new Set()
    return this
  }

  pretty(pretty) {
    this._processor.pretty = pretty
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
    this._processor.nodes.push(node(...args))
    this.notify()
    return this
  }

  nodes(nodes) {
    this._processor.nodes = this._processor.nodes.concat(nodes)
    this.notify()
    return this
  }

  namespace(name) {
    if (!name) { return null }
    const ns = this._processor.namespaces[name] || Object.create(null)
    this._processor.namespaces[name] = ns
    return ns
  }

  overrides(overrides) {
    this._processor.overrides = overrides
    this.notify()
    return this
  }

  resolve() {
    return this._processor.resolve()
  }
}

export default Reisy
