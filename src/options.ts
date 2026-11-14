import type { MacroPackageClass } from "./macros.ts"


// Generator options
export interface Options
{
    // used only by by the parser if no preamble was given, then this sets the documentclass to use
    // default is "article"
    documentClass: string
    precision: number

    hyphenate: boolean
    languagePatterns?: any

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
