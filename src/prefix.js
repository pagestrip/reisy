/* eslint-disable */
import {createPrefixer} from "inline-style-prefixer"

/* run `npm run static` to regenerate these settings */

import calc from 'inline-style-prefixer/lib/plugins/calc'
import crossFade from 'inline-style-prefixer/lib/plugins/crossFade'
import cursor from 'inline-style-prefixer/lib/plugins/cursor'
import filter from 'inline-style-prefixer/lib/plugins/filter'
import flex from 'inline-style-prefixer/lib/plugins/flex'
import flexboxIE from 'inline-style-prefixer/lib/plugins/flexboxIE'
import flexboxOld from 'inline-style-prefixer/lib/plugins/flexboxOld'
import gradient from 'inline-style-prefixer/lib/plugins/gradient'
import imageSet from 'inline-style-prefixer/lib/plugins/imageSet'
import position from 'inline-style-prefixer/lib/plugins/position'
import sizing from 'inline-style-prefixer/lib/plugins/sizing'
import transition from 'inline-style-prefixer/lib/plugins/transition'
var w = ["Webkit"];
var m = ["Moz"];
var ms = ["ms"];
var wm = ["Webkit","Moz"];
var wms = ["Webkit","ms"];
var wmms = ["Webkit","Moz","ms"];

const config = {
  plugins: [calc,crossFade,cursor,filter,flex,flexboxIE,flexboxOld,gradient,imageSet,position,sizing,transition],
  prefixMap: {"animation":w,"animationDelay":w,"animationDirection":w,"animationFillMode":w,"animationDuration":w,"animationIterationCount":w,"animationName":w,"animationPlayState":w,"animationTimingFunction":w,"appearance":wm,"userSelect":wmms,"textEmphasisPosition":w,"textEmphasis":w,"textEmphasisStyle":w,"textEmphasisColor":w,"boxDecorationBreak":w,"clipPath":w,"maskImage":w,"maskMode":w,"maskRepeat":w,"maskPosition":w,"maskClip":w,"maskOrigin":w,"maskSize":w,"maskComposite":w,"mask":w,"maskBorderSource":w,"maskBorderMode":w,"maskBorderSlice":w,"maskBorderWidth":w,"maskBorderOutset":w,"maskBorderRepeat":w,"maskBorder":w,"maskType":w,"textDecorationStyle":w,"textDecorationSkip":w,"textDecorationLine":w,"textDecorationColor":w,"filter":w,"fontFeatureSettings":w,"breakAfter":wmms,"breakBefore":wmms,"breakInside":wmms,"columnCount":wm,"columnFill":wm,"columnGap":wm,"columnRule":wm,"columnRuleColor":wm,"columnRuleStyle":wm,"columnRuleWidth":wm,"columns":wm,"columnSpan":wm,"columnWidth":wm,"writingMode":wms,"flex":wms,"flexBasis":w,"flexDirection":wms,"flexGrow":w,"flexFlow":wms,"flexShrink":w,"flexWrap":wms,"alignContent":w,"alignItems":w,"alignSelf":w,"justifyContent":w,"order":w,"transitionDelay":w,"transitionDuration":w,"transitionProperty":w,"transitionTimingFunction":w,"transform":w,"transformOrigin":w,"transformOriginX":w,"transformOriginY":w,"backfaceVisibility":w,"perspective":w,"perspectiveOrigin":w,"transformStyle":w,"transformOriginZ":w,"backdropFilter":w,"fontKerning":w,"scrollSnapType":wms,"scrollSnapPointsX":wms,"scrollSnapPointsY":wms,"scrollSnapDestination":wms,"scrollSnapCoordinate":wms,"shapeImageThreshold":w,"shapeImageMargin":w,"shapeImageOutside":w,"hyphens":wmms,"flowInto":wms,"flowFrom":wms,"regionFragment":wms,"textAlignLast":m,"tabSize":m,"wrapFlow":ms,"wrapThrough":ms,"wrapMargin":ms,"touchAction":ms,"gridTemplateColumns":ms,"gridTemplateRows":ms,"gridTemplateAreas":ms,"gridTemplate":ms,"gridAutoColumns":ms,"gridAutoRows":ms,"gridAutoFlow":ms,"grid":ms,"gridRowStart":ms,"gridColumnStart":ms,"gridRowEnd":ms,"gridRow":ms,"gridColumn":ms,"gridColumnEnd":ms,"gridColumnGap":ms,"gridRowGap":ms,"gridArea":ms,"gridGap":ms,"textSizeAdjust":wms,"borderImage":w,"borderImageOutset":w,"borderImageRepeat":w,"borderImageSlice":w,"borderImageSource":w,"borderImageWidth":w}
}

export default createPrefixer(config);