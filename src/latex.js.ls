``#!/usr/bin/env node``

# on the server we need to include a DOM implementation - BEFORE requiring HtmlGenerator below
global.document = require 'domino' .createDocument!

require! {
    util
    fs
    commander: program
    'get-stdin': get-stdin
    'js-beautify': { html: beautify-html }

    '../dist/latex-parser': latexjs
    '../dist/html-generator': { HtmlGenerator }

    'hyphenation.en-us': en
    'hyphenation.de':    de

    '../package.json': info
}


program
    .name info.name
    .version info.version
    .description 'translate a LaTeX document to HTML5'

    .usage '[options] [files...]'

    .option '-b, --beautify',           'beautify the html (careful: this adds unwanted spaces in some places)'
    .option '-s, --no-soft-hyphenate',  'don\'insert soft hyphens (disables automatic hyphenation in the browser)'
    .option '-l, --language <lang>',    'set hyphenation language (default en)', 'en'
    .option '-o, --output <file>',      'specify output file, otherwise STDOUT will be used'

    .parse process.argv


const options =
    hyphenate: program.softHyphenate
    languagePatterns: switch program.language
    | 'en' => en
    | 'de' => de
    | otherwise console.error "language #{that} is not supported yet"


generator = new HtmlGenerator(options)


const readFile = util.promisify(fs.readFile)

if program.args.length
    input = Promise.all program.args.map (file) -> readFile(file)
else
    input = get-stdin!


input.then (text) ->
    if text.join
        text = text.join "\n\n"

    html = latexjs.parse text, { generator: generator } .html!

    if program.beautify
        html = beautify-html html

    if program.output
        fs.writeFileSync program.output, html
    else
        process.stdout.write html + '\n'
