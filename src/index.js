import * as types from "./types.js"
import Reisy from "./reisy.js"
import {use, inject} from "./browser.js"

// export a singleton
export const reisy = new Reisy()
export default Reisy
export {types, use, inject}

// XXX: remove in 2.0.0
// even though this has never been documented, we should keep exports because
// of semver
export const {decl, multidecl, rule, keyframes, font, node} = types
