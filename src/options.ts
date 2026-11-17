import type { MacroPackageClass } from "./macros.ts"


// inserts soft hyphens (U+00AD) into text; compatible with hyphenateSync from the "hyphen" package
export type Hyphenator = (text: string) => string


// Generator options
export interface Options
{
    // used only by by the parser if no preamble was given, then this sets the documentclass to use
    // default is "article"
    documentClass: string
    precision: number

    // true: hyphenate using the bundled English patterns; false: no hyphenation;
    // or a hyphenation function for another language, e.g. hyphenateSync from "hyphen/de"
    hyphenate: boolean | Hyphenator

    // a class with additional macros; those override all other macros (except document-local definitions)
    CustomMacros?: MacroPackageClass
}


export interface HtmlOptions extends Options
{
    styles: Array<string>
    // [key: string]: any
}



// Package/DocumentClass options
export type PackageOpts = Map<string, string>;
