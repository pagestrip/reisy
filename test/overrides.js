import Reisy, {node, rule, keyframes, font, decl} from "../src/"
import {expect} from "chai"

describe("overrides", () => {
  it("should support overriding keyframes", () => {
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

    inst.overrides([
      node("Anim", "Foo", [], keyframes([
        ["0%", rule([
          ["width", decl("100px")],
        ])],
        ["100%", rule([
          ["width", decl("200px")],
        ])],
      ])),
    ])

    const css = inst.resolve()
    expect(css).to.equal(
`@keyframes Anim-Foo {
  0% {
    width: 100px;
  }
  100% {
    width: 200px;
  }
}
@-webkit-keyframes Anim-Foo {
  0% {
    width: 100px;
  }
  100% {
    width: 200px;
  }
}
.Header-Container {
  animation: Anim-Foo 1s infinite linear;
  -webkit-animation: Anim-Foo 1s infinite linear;
}`)
  })

  it("should support overriding fonts", () => {
    const inst = new Reisy()
    inst.node("Fonts", "Default", [], font([
      ["src", decl("url(foo.woff) format('woff')")],
      ["fontWeight", decl("normal")],
      ["fontStyle", decl("normal")],
    ]))
    inst.node("Header", "Container", ["Fonts.Default"], rule([
      ["fontFamily", decl("", "Fonts.Default")],
    ]))

    inst.overrides([
      node("Fonts", "Default", [], font([
        ["src", decl("url(override.woff) format('woff')")],
        ["fontWeight", decl("normal")],
        ["fontStyle", decl("normal")],
      ])),
    ])

    const css = inst.resolve()
    expect(css).to.equal(
`@font-face {
  font-family: Fonts-Default;
  src: url(override.woff) format(\'woff\');
  font-weight: normal;
  font-style: normal;
}
.Header-Container {
  font-family: Fonts-Default;
}`)
  })

  it("should support overriding declarations", () => {
    const inst = new Reisy()
    inst.node("Consts", "FooBar", ["Consts.Bar"], decl("Foo", "Consts.Bar"))
    inst.node("Consts", "Bar", [], decl("Bar"))
    const ns = inst.namespace("Consts")

    inst.overrides([
      node("Consts", "Bar", [], decl("Foo")),
    ])

    inst.resolve()
    expect(ns).to.eql({
      FooBar: "FooFoo",
      Bar: "Foo",
    })
  })

  it("should support overriding/extending existing rule", () => {
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

    inst.overrides([
      node("Helpers", "Pointer", [], rule([
        ["cursor", decl("pointer")],
      ])),
      node("Header", "Container", ["Helpers.Pointer"], rule([
        ["position", decl("sticky")],
      ], ["Helpers.Pointer"])),
    ])

    const css = inst.resolve()
    expect(css).to.eql(
`.Helpers-AbsFull {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.Helpers-Pointer {
  cursor: pointer;
}
.Header-Container {
  position: fixed;
}
.Header-Container {
  position: sticky;
}`)
    expect(ns).to.eql({
      Container: "Helpers-Pointer Helpers-AbsFull Header-Container",
    })
  })
})
