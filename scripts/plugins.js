import babel from "rollup-plugin-babel"
export default [
  babel({
    babelrc: false,
    presets: [
      ["es2015", {modules: false}],
    ],
    plugins: [
      "external-helpers",
    ],
  }),
]
