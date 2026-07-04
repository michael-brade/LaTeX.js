import he from 'he'
import { parse, SyntaxError } from './parser/latex-parser.pegjs'
import { Generator } from './generator/generator.ts'
import { HtmlGenerator } from './html-generator.ls'
import { LaTeXJSComponent } from './latex.component.mjs'

export {
    he,
    parse,
    SyntaxError,
    Generator,
    HtmlGenerator,
    LaTeXJSComponent
}
