import Reisy, {node, rule, decl} from "../src/"
import {expect} from "chai"

describe("Errors", () => {
  it("should throw an Error when specifying an invalid dependency", () => {
    const inst = new Reisy()
    inst.node("Foo", "Bar", ["Foo.Foobar"], decl("FooBar"))
    expect(() => inst.resolve()).to.throw('Invalid dependency on "Foo.Foobar". A typo maybe?')
  })

  it("should throw an Error when specifying an circular dependency", () => {
    const inst = new Reisy()
    inst.node("Foo", "Foo", ["Foo.Bar"], decl("Foo"))
    inst.node("Foo", "Bar", ["Foo.Foo"], decl("Bar"))
    expect(() => inst.resolve()).to.throw('Node "Foo.Foo" is part of a cyclic dependency.')
  })

  it("should throw when mixing types on override", () => {
    const inst = new Reisy()
    inst.node("Foo", "Bar", [], decl("Foo"))

    inst.overrides([
      node("Foo", "Bar", [], rule([])),
    ])

    expect(() => inst.resolve()).to.throw('Incompatible types for node "Foo.Bar": "rule" and "decl".')
  })

  it("should throw an Error when extending a non-existant rule", () => {
    const inst = new Reisy()
    inst.node("Foo", "Bar", [], rule([], ["Foo.Foo"]))
    expect(() => inst.resolve()).to.throw('"Foo.Bar" extends non-existant "Foo.Foo". A typo maybe?')
  })
})
