#!/usr/bin/env node

// #region code
import { createHTMLWindow } from 'svgdom'

// LaTeX.js needs a DOM; it has to exist before latex.js is loaded
global.window = createHTMLWindow()
global.document = window.document

// a static import would be evaluated before the globals above are set
const { parse, HtmlGenerator } = await import('latex.js')


let latex = "Hi, this is a line of text."

let generator = new HtmlGenerator({ hyphenate: false })

let doc = parse(latex, { generator: generator }).htmlDocument()

console.log('<!DOCTYPE html>' + doc.documentElement.outerHTML)
// #endregion code
