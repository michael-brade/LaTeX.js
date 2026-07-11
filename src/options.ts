// Generator options
export interface Options
{
    documentClass: string
    precision: number

    hyphenate: boolean
    languagePatterns?: any
}


export interface HtmlOptions extends Options
{
    styles: Array<string>
    // [key: string]: any
}



// Package/DocumentClass options
export type PackageOpts = Record<string, any>[];
