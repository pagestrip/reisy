// @flow

export type PubDecl = string | number | boolean | Array<string>
declare function decl(value: string | number | boolean): PubDecl
declare function decl(...value: Array<string>): PubDecl
export function decl(...value) {
  if (value.length === 1) {
    return value[0]
  }
  return value
}

export type PubMultiDecl = {
  type: "multidecl",
  values: Array<PubDecl>,
}
export function multidecl(...values: Array<PubDecl>): PubMultiDecl {
  return {
    type: "multidecl",
    values,
  }
}

export type PubDef = [string, PubNodeType | PubMultiDecl]
export type PubRule = {
  type: "rule",
  defs: Array<PubDef>,
  parents: Array<string>,
}
export function rule(defs: Array<PubDef>, parents: Array<string> = []): PubRule {
  return {
    type: "rule",
    defs,
    parents,
  }
}

export type PubKeyframes = {
  type: "keyframes",
  defs: Array<PubDef>,
}
export function keyframes(defs: Array<PubDef>): PubKeyframes {
  return {
    type: "keyframes",
    defs,
  }
}

export type PubFont = {
  type: "font",
  defs: Array<PubDef>,
}
export function font(...defs: Array<PubDef>): PubFont {
  return {
    type: "font",
    defs,
  }
}

export type PubNodeType =
  | PubDecl
  | PubRule
  | PubKeyframes
  | PubFont

export type PubNode = {
  ns: string,
  name: string,
  deps: Array<string>,
  def: PubNodeType,
}
export function node(ns: string, name: string, deps: Array<string>, def: PubNodeType): PubNode {
  return {
    ns, name,
    deps, def,
  }
}
