#!/usr/bin/env node

// #region code
const { parse, HtmlGenerator } = require('latex.js')
const { createHTMLWindow } = require('svgdom')

global.window = createHTMLWindow()
global.document = window.document


let latex = "Hi, this is a line of text."

let generator = new HtmlGenerator({ hyphenate: false })

let doc = parse(latex, { generator: generator }).htmlDocument()

console.log(doc.documentElement.outerHTML)
// #endregion code