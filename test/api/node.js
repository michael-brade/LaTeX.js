#!/usr/bin/env babel-node

const { parse, HtmlGenerator } = require(`../../dist/latex`)    // from 'latex.js' when used in a normal environment

let latex = "Hi, this is a line of text."

let generator = new HtmlGenerator({ hyphenate: false })

let doc = parse(latex, { generator: generator }).htmlDocument()

console.log(doc.outerHTML)
