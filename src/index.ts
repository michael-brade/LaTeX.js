import { parse, SyntaxError } from './parser/latex-parser.pegjs'
import { Generator } from './generator/generator.ts'
import { HtmlGenerator } from './generator/html/generator.ts'
import { LaTeXJSComponent } from './latex.component.ts'
import type { HtmlOptions, Hyphenator } from './options.ts'

import { resetDid } from '@svgdotjs/svg.js'

// svg.js is bundled into latex.js, so its element-id counter is private to this bundle;
// export a reset so that consumers (e.g. tests) can get reproducible SVG ids, but make
// this a wrapper instead of re-exporting so that the published types don't depend on svg.js
function resetSvgIds(): void
{
    resetDid()
}


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

export type {
    HtmlOptions,
    Hyphenator
}

export {
    parseLaTeXtoHTML,
    parse,
    SyntaxError,
    Generator,
    HtmlGenerator,
    LaTeXJSComponent,
    resetSvgIds
}
