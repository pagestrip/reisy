import prefix from "inline-style-prefix-all"
import Processor from "./process.js"
import {decl, multidecl, rule, keyframes, font, node} from "./types.js"
export {decl, multidecl, rule, keyframes, font, node}

// TODO:
// * use either Flow or TS to ensure type safety

class Reisy {
  constructor() {
    this.reset()
  }

  reset() {
    this._nodes = []
    this._overrides = []
    this._namespaces = Object.create(null)
    this._listeners = new Set()
    return this
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

// export a singleton
export const reisy = new Reisy()

export function use(...args) {
  const style = {}
  const classNames = []

  args.forEach(processDef)

  return {
    className: classNames.join(" "),
    style: prefix(style),
  }

  function processDef(def) {
    if (!def) { return }
    if (typeof def === "string") {
      classNames.push(def)
    } else if (Array.isArray(def)) {
      def.forEach(processDef)
    } else {
      Object.assign(style, def)
    }
  }
}

export function inject(instance = reisy) {
  const style = document.createElement("style")
  document.head.appendChild(style)
  setCSS()
  instance.on(setCSS)
  return () => {
    instance.off(setCSS)
    document.head.removeChild(style)
  }

  function setCSS() {
    const css = instance.resolve()
    style.textContent = css
  }
}
