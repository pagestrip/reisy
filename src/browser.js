import prefix from "inline-style-prefix-all"
import {reisy} from "./index.js"

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

