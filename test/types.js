import Reisy from "../src/"
import {rule, keyframes, font, decl, multidecl} from "../src/types.js"
import {expect} from "chai"

describe("Typed API", () => {
  it("should support keyframes", () => {
    const inst = new Reisy()
    inst.node("Anim", "Foo", [], keyframes([
      ["0%", rule([
        ["width", decl("0px")],
      ])],
      ["100%", rule([
        ["width", decl("100px")],
      ])],
    ]))
    inst.node("Header", "Container", ["Anim.Foo"], rule([
      ["animation", decl("", "Anim.Foo", " 1s infinite linear")],
    ]))
    const css = inst.resolve()
    expect(css).to.equal(
`@keyframes Anim-Foo {
  0% {
    width: 0px;
  }
  100% {
    width: 100px;
  }
}
@-webkit-keyframes Anim-Foo {
  0% {
    width: 0px;
  }
  100% {
    width: 100px;
  }
}
.Header-Container {
  -webkit-animation: Anim-Foo 1s infinite linear;
  animation: Anim-Foo 1s infinite linear;
}`)
  })

  it("should support fonts", () => {
    const inst = new Reisy()
    inst.node("Fonts", "Default", [], font([
      ["src", decl("url(normal.woff) format('woff')")],
      ["fontWeight", decl("normal")],
      ["fontStyle", decl("normal")],
    ], [
      ["src", decl("url(bold.woff) format('woff')")],
      ["fontWeight", decl("bold")],
      ["fontStyle", decl("normal")],
    ]))
    inst.node("Header", "Container", ["Fonts.Default"], rule([
      ["fontFamily", decl("", "Fonts.Default")],
    ]))
    const css = inst.resolve()
    expect(css).to.equal(
`@font-face {
  font-family: Fonts-Default;
  src: url(normal.woff) format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: Fonts-Default;
  src: url(bold.woff) format('woff');
  font-weight: bold;
  font-style: normal;
}
.Header-Container {
  font-family: Fonts-Default;
}`)
  })

  it("should support simple global rules", () => {
    const inst = new Reisy()
    inst.node("", "html", [], rule([
      ["margin", decl("0")],
      ["padding", decl("0")],
    ]))
    const css = inst.resolve()
    expect(css).to.equal(
      "html {\n  margin: 0;\n  padding: 0;\n}")
  })

  it("should support nested rules", () => {
    const inst = new Reisy()
    inst.node("", "html", [], rule([
      ["margin", decl("0")],
      ["padding", decl("0")],
      ["body", rule([
        ["margin", decl("0")],
        ["padding", decl("0")],
      ])],
    ]))
    const css = inst.resolve()
    expect(css).to.equal(
      "html {\n  margin: 0;\n  padding: 0;\n}\nhtml body {\n  margin: 0;\n  padding: 0;\n}")
  })

  it("should support nested @rules", () => {
    const inst = new Reisy()
    inst.node("", "html", [], rule([
      ["@media foo", rule([
        ["marginLeft", decl("0")],
        ["padding", decl("0")],
      ])],
    ]))
    const css = inst.resolve()
    expect(css).to.equal(
      "@media foo {\n  html {\n    margin-left: 0;\n    padding: 0;\n  }\n}")
  })

  it("should support pseudo selectors and classes", () => {
    const inst = new Reisy()
    inst.node("Header", "Container", [], rule([
      ["&:hover", rule([
        ["cursor", decl("pointer")],
      ])],
      ["&::before, &::after", rule([
        ["display", decl("block")],
      ])],
    ]))
    const css = inst.resolve()
    expect(css).to.eql(
`.Header-Container:hover {
  cursor: pointer;
}
.Header-Container::before, .Header-Container::after {
  display: block;
}`)
  })

  it("should support multiple values", () => {
    const inst = new Reisy()
    inst.node("Header", "Container", [], rule([
      ["position", multidecl("fixed", "sticky")],
    ]))
    const css = inst.resolve()
    expect(css).to.eql(
`.Header-Container {
  position: fixed;
  position: -webkit-sticky;
  position: sticky;
}`)
  })

  it("should support extending another rule", () => {
    const inst = new Reisy()
    inst.node("Helpers", "AbsFull", [], rule([
      ["position", decl("absolute")],
      ["top", decl("0")],
      ["right", decl("0")],
      ["bottom", decl("0")],
      ["left", decl("0")],
    ]))
    inst.node("Header", "Container", ["Helpers.AbsFull"], rule([
      ["position", decl("fixed")],
    ], ["Helpers.AbsFull"]))
    const ns = inst.namespace("Header")
    const css = inst.resolve()
    expect(css).to.eql(
`.Helpers-AbsFull {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.Header-Container {
  position: fixed;
}`)
    expect(ns).to.eql({
      Container: "Helpers-AbsFull Header-Container",
    })
  })

  it("should support interpolated declarations", () => {
    const inst = new Reisy()
    inst.node("Consts", "FooBar", ["Consts.Bar"], decl("Foo", "Consts.Bar"))
    inst.node("Consts", "Bar", [], decl("Bar"))
    const ns = inst.namespace("Consts")
    inst.resolve()
    expect(ns).to.eql({
      FooBar: "FooBar",
      Bar: "Bar",
    })
  })

  it("should support interpolated property names and values", () => {
    const inst = new Reisy()
    inst.node("Consts", "Prop", [], decl("content"))
    inst.node("Header", "Container", ["Consts.Prop"], rule([
      [["", "Consts.Prop"], decl('"', "Consts.Prop", '"')],
    ]))
    const css = inst.resolve()
    expect(css).to.eql(
      '.Header-Container {\n  content: "content";\n}')
  })

  it("should expose namespaced constant values", () => {
    const inst = new Reisy()
    inst.node("Consts", "Foo", [], decl("Foo"))
    const ns = inst.namespace("Consts")
    inst.resolve()
    expect(ns).to.eql({
      Foo: "Foo",
    })
  })

  it("should expose namespaced classNames", () => {
    const inst = new Reisy()
    inst.node("Header", "Container", [], rule([
      ["margin", decl("0")],
    ]))
    const ns = inst.namespace("Header")
    const css = inst.resolve()
    expect(css).to.eql(
      ".Header-Container {\n  margin: 0;\n}")
    expect(ns).to.eql({
      Container: "Header-Container",
    })
  })

  it("should do prefixing for obsolete browsers", () => {
    const inst = new Reisy()
    inst.node("Header", "Container", [], rule([
      ["display", decl("flex")],
      ["flexDirection", decl("row")],
      ["flexShrink", decl("0")],
    ]))
    const css = inst.resolve()
    expect(css).to.eql(
`.Header-Container {
  display: -webkit-box;
  display: -moz-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
  -ms-flex-negative: 0;
}`)
  })
})
