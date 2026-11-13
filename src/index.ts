import * as he from 'he'

import { parse, SyntaxError } from './parser/latex-parser.pegjs'
import { Generator } from './generator/generator.ts'
import { HtmlGenerator } from './generator/html/generator.ts'
import { LaTeXJSComponent } from './latex.component.mjs'
import type { HtmlOptions } from './options.ts'

// svg.js is bundled into latex.js, so its element-id counter is private to this bundle;
// re-export the reset so that consumers (e.g. tests) can get reproducible SVG ids.
import { resetDid as resetSvgIds } from '@svgdotjs/svg.js'


/**
 * Translate LaTeX to HTML using the default configuration.
 *
 * @param latex The LaTeX source
 * @param options
 */
function parseLaTeXtoHTML(latex: string, options?: Partial<HtmlOptions>)
{
    const generator = new HtmlGenerator(options)

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
    LaTeXJSComponent,
    resetSvgIds
}
