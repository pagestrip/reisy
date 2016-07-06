import {reisy} from "../src/"
import {transform} from "babel-core"
import {expect} from "chai"
import plugin from "../src/plugin"
import fs from "fs"

const opts = {
  plugins: [plugin],
}

function parse(str) {
  const {code} = transform(`const output = reisy\`${str}\`;`, opts)
  // eslint-disable-next-line no-new-func
  return (new Function("reisy", `${code} return output`))(reisy)
}

function run(defs, overrides) {
  if (overrides) {
    parse(overrides)
    overrides = reisy._nodes
    reisy.reset()
  }
  const ns = parse(defs)
  if (overrides) {
    reisy.overrides(overrides)
  }
  const css = reisy.resolve()
  return {
    ns, css,
  }
}

describe("Plugin", () => {
  afterEach(() => reisy.reset())

  it("should preserve !important ", () => {
    const {css} = run(`
@namespace Foo;
Bar: foobar;
@namespace;

.foo,
.bar {
  bar: foobar !important;
  foo: $Foo.Bar !important;
}`)
    expect(css).to.equal(
`.foo, .bar {
  bar: foobar !important;
  foo: foobar !important;
}`)
  })

  it("should handle normalize.css", () => {
    const file = require.resolve("normalize.css")
    const normalize = fs.readFileSync(file, "utf-8")
      .replace(/`/g, '"') // because we are making a template string out of it
    const {css} = run(normalize)
    expect(css.length).to.be.greaterThan(0)
  })

  it("should allow interpolation shortcuts", () => {
    const {css} = run(`
@namespace Foo;
Foo: foo;

Bar {
  foobar: $(Foo)bar;
}
Foobar {
  @extends Bar;
  foo-bar: $Foo bar;
  foo: $Foo;
}
`)
    expect(css).to.equal(
`.Foo-Bar {
  foobar: foobar;
}
.Foo-Foobar {
  foo-bar: foo bar;
  foo: foo;
}`)
  })

  it("should support keyframes", () => {
    const {css} = run(`
@namespace Anim;
@keyframes Foo {
  0% {
    width: 0px;
  }
  100% {
    width: 100px;
  }
}

@namespace Header;
Container {
  animation: $Anim.Foo 1s infinite linear;
}`)
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
  animation: Anim-Foo 1s infinite linear;
  -webkit-animation: Anim-Foo 1s infinite linear;
}`)
  })

  it.skip("should support fonts", () => {
    const {css} = run(`
@namespace Fonts;
@font-face Default {
  src: url(normal.woff) format('woff');
  font-weight: normal;
  font-style: normal;
}
@font-face Default {
  src: url(bold.woff) format('woff');
  font-weight: normal;
  font-style: normal;
}

@namespace Header;
Container {
  font-family: $Fonts.Default;
}
`)
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

  it("should support simple global rules", () => {
    const {css} = run(`
html {
  margin: 0;
  padding: 0;
}`)
    expect(css).to.equal(
      "html {\n  margin: 0;\n  padding: 0;\n}")
  })

  it("should support nested rules", () => {
    const {css} = run(`
html {
  margin: 0;
  padding: 0;
  body {
    margin: 0;
    padding: 0;
  }
}`)
    expect(css).to.equal(
      "html {\n  margin: 0;\n  padding: 0;\n}\nhtml body {\n  margin: 0;\n  padding: 0;\n}")
  })

  it("should support nested @rules", () => {
    const {css} = run(`
html {
  @media foo {
    margin-left: 0;
    padding: 0;
  }
}`)
    expect(css).to.equal(
      "@media foo {\n  html {\n    margin-left: 0;\n    padding: 0;\n  }\n}")
  })

  it("should support pseudo selectors and classes", () => {
    const {css} = run(`
@namespace Header;
Container {
  &:hover {
    cursor: pointer;
  }
  &::before, &::after {
    display: block;
  }
}`)
    expect(css).to.eql(
`.Header-Container:hover {
  cursor: pointer;
}
.Header-Container::before, .Header-Container::after {
  display: block;
}`)
  })

  it("should support resetting namespaces", () => {
    const {css} = run(`
@namespace Header;

Container {
  height: 100px;
}

@namespace;

html {
  min-height: 100%;
}`)
    expect(css).to.eql(
`.Header-Container {
  height: 100px;
}
html {
  min-height: 100%;
}`)
  })

  it("should support multiple values", () => {
    const {css} = run(`
@namespace Header;
Container {
  top: 0;
  top: 1px;
  position: absolute;
  position: fixed;
  position: sticky;
}`)
    expect(css).to.eql(
`.Header-Container {
  top: 0;
  top: 1px;
  position: absolute;
  position: fixed;
  position: sticky;
}`)
  })

  it("should support extending another rule", () => {
    const {ns, css} = run(`
@namespace Helpers;
AbsFull {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
}

@namespace Header;
Container {
  @extends Helpers.AbsFull;
  position: fixed;
}`)
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
    const {ns} = run(`
@namespace Consts;

FooBar: Foo$(Consts.Bar);
Bar: Bar;`)
    expect(ns).to.eql({
      FooBar: "FooBar",
      Bar: "Bar",
    })
  })

  it("should support declarations with boolean or number type", () => {
    const {ns} = run(`
@namespace Consts;

True: true;
False: false;
PI: 3.14;`)
    expect(ns).to.eql({
      True: true,
      False: false,
      PI: 3.14,
    })
  })

  it("should forward declaration types", () => {
    const {ns} = run(`
@namespace Consts;

True: true;
False: false;
PI: 3.14;

@namespace Foo;

Foo: $Consts.True;
Bar: $Consts.PI;
`)
    expect(ns).to.eql({
      Foo: true,
      Bar: 3.14,
    })
  })

  it("should support interpolated property names and values", () => {
    const {css} = run(`
@namespace Consts;
Prop: content;

@namespace Header;
Container {
  $Consts.Prop: "$Consts.Prop";
}`)
    expect(css).to.eql(
      '.Header-Container {\n  content: "content";\n}')
  })

  it("should do prefixing for obsolete browsers", () => {
    const {css} = run(`
@namespace Header;
Container {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
}`)
    expect(css).to.eql(
`.Header-Container {
  display: -webkit-box;
  display: -moz-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
}`)
  })

  it("should not double add parents when overriding", () => {
    const {ns, css} = run(`
@namespace Helpers;

AbsFull {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
}

@namespace Header;

Container {
  @extends Helpers.AbsFull;
  position: fixed;
}
`, `
@namespace Header;

Container {
  @extends Helpers.AbsFull;
  font-size: 2em;
}
`)

    expect(ns).to.eql({
      Container: "Helpers-AbsFull Header-Container",
    })
    expect(css).to.equal(
`.Helpers-AbsFull {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.Header-Container {
  position: fixed;
}
.Header-Container {
  font-size: 2em;
}`)
  })
})
