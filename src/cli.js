import parse from "./parser.js"
import fs from "fs"
import path from "path"

const json = str => JSON.stringify(parse(str).nodes)

if (process.argv[2]) {
  // file
  const name = process.argv[2]
  const input = path.resolve(name)
  const output = json(fs.readFileSync(input, "utf-8"))

  if (process.argv[3] === "-") {
    console.log(output)
  } else {
    const dir = path.dirname(input)
    const basename = path.basename(name, ".css")
    const outputFile = path.join(dir, `${basename}.json`)
    fs.writeFileSync(outputFile, outputFile)
    console.log(`${input} -> ${outputFile}`)
  }
} else {
  // stdio
  process.stdin.resume()
  process.stdin.setEncoding("utf8")

  let input = ""
  process.stdin.on("data", chunk => (input += chunk))
  process.stdin.on("end", () => {
    console.log(json(input))
  })
}
