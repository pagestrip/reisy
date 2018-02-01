/* eslint-disable */
const generateData = require("inline-style-prefixer/generator");

const browserList = {
  chrome: 42,
  android: 4,
  firefox: 40,
  ios_saf: 6,
  safari: 6,
  ie: 10,
  ie_mob: 11,
  edge: 12,
  opera: 16,
  op_mini: 12,
  and_uc: 9,
  and_chr: 46,
}

generateData(browserList, {
  staticPath: `${__dirname}/staticData.js`,
})