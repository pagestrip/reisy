import fromCSS from "./fromcss.js"
import toCSS from "./tocss.js"

// XXX: remove these hacks once we hit 2.0
fromCSS.fromCSS = fromCSS
fromCSS.toCSS = toCSS
export default fromCSS

//export {
//  fromCSS,
//  toCSS,
//}
