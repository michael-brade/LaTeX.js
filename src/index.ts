import he from 'he'

import { parse, SyntaxError } from './parser/latex-parser.pegjs'
import { Generator } from './generator/generator.ts'
import { HtmlGenerator } from './html-generator.ts'
import { LaTeXJSComponent } from './latex.component.mjs'
import type { HtmlOptions } from './options.ts'


/**
 * Translate LaTeX to HTML using the default configuration.
 *
 * @param latex The LaTeX source
 * @param options
 */
function parseLaTeXtoHTML(latex: string, options?: HtmlOptions)
{
    const generator = new HtmlGenerator(options)

    generator.macroManager.loadPackage("latex.ltx", undefined)

    // parse
    const result = parse(latex, {
        generator: generator
    })
}


export {
    parseLaTeXtoHTML,
    he,
    parse,
    SyntaxError,
    Generator,
    HtmlGenerator,
    LaTeXJSComponent
}
