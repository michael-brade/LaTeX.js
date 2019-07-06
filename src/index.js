import he from 'he'
import { parse } from './latex-parser'
import { Generator } from './generator'
import { HtmlGenerator } from './html-generator'


const latexjs = {
    he,
    parse,
    Generator,
    HtmlGenerator
}

export default latexjs;
