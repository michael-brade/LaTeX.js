#!/usr/bin/env node

// #region code
const { createHTMLWindow } = require('svgdom')

// LaTeX.js needs a DOM; it has to exist before latex.js is loaded
global.window = createHTMLWindow()
global.document = window.document

const { parse, HtmlGenerator } = require('latex.js')


let latex = "Hi, this is a line of text."

let generator = new HtmlGenerator({ hyphenate: false })

let doc = parse(latex, { generator: generator }).htmlDocument()

console.log(doc.documentElement.outerHTML)
// #endregion code
