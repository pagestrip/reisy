import Reisy, {rule, font, decl} from "../src/"
import {expect} from "chai"

describe("Reisy", () => {
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
  src: url(normal.woff) format(\'woff\');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: Fonts-Default;
  src: url(bold.woff) format(\'woff\');
  font-weight: bold;
  font-style: normal;
}
.Header-Container {
  font-family: Fonts-Default;
}`)
  })
})
