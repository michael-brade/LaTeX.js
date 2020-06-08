#!/usr/bin/env node

// #region code
import { parse, HtmlGenerator } from 'latex.js'
import { createHTMLWindow } from 'svgdom'

global.window = createHTMLWindow()
global.document = window.document


let latex = "Hi, this is a line of text."

let generator = new HtmlGenerator({ hyphenate: false })

let doc = parse(latex, { generator: generator }).htmlDocument()

console.log(doc.documentElement.outerHTML)
// #endregion code
