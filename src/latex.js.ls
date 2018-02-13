``#!/usr/bin/env node``

# on the server we need to include a DOM implementation - BEFORE requiring HtmlGenerator below
global.window = require 'svgdom'
global.document = window.document

require! {
    util
    fs
    path
    he
    stdin
    commander: program
    'js-beautify': { html: beautify-html }

    '../dist/latex-parser': latexjs
    '../dist/html-generator': { HtmlGenerator }

    'hyphenation.en-us': en
    'hyphenation.de':    de

    '../package.json': info
}

he.encode.options.strict = true
he.encode.options.useNamedReferences = true

addStyle = (url, styles) ->
    if not styles
        [url]
    else
        [...styles, url]


program
    .name info.name
    .version info.version
    .description 'translate a LaTeX document to HTML5'

    .usage '[options] [files...]'


    .option '-o, --output <file>',      'specify output file, otherwise STDOUT will be used'

    # options affecting the HTML output
    .option '-b, --bare',               'don\'t include HTML boilerplate and CSS, only output the contents of body'
    .option '-e, --entities',           'encode HTML entities in the output instead of using UTF-8 characters'
    .option '-p, --pretty',             'beautify the html (this may add/remove spaces unintentionally)'

    # options about LaTeX and style
    .option '-c, --class <class>',      'set a default documentclass for documents without a preamble', 'article'
    .option '-m, --macros <file>',      'load a JavaScript file with additional custom macros'
    .option '-s, --style <url>',        'specify an additional style sheet to use (can be repeated)', addStyle

    .option '-n, --no-hyphenation',     'don\'t insert soft hyphens (disables automatic hyphenation in the browser)'
    .option '-l, --language <lang>',    'set hyphenation language', 'en'


    .on '--help', -> console.log '\n  If no input files are given, STDIN is read.\n'

    .parse process.argv



if program.macros
    Name = path.posix.basename that
    CustomMacros = (require that)[Name]   # TODO

if program.bare and program.style
    console.error "  error: conflicting options 'bare' and 'style' given!"
    process.exit 1


const options =
    hyphenate:          program.hyphenation
    languagePatterns:   switch program.language
                        | 'en' => en
                        | 'de' => de
                        | otherwise console.error "  error: language '#{that}' is not supported yet"; process.exit 1
    documentClass:      program.class
    CustomMacros:       CustomMacros
    bare:               program.bare
    styles:             program.style || []



generator = new HtmlGenerator(options)


const readFile = util.promisify(fs.readFile)

if program.args.length
    input = Promise.all program.args.map (file) -> readFile file
else
    input = new Promise (resolve, reject) !-> stdin (str) !-> resolve str


input.then (text) ->
    if text.join
        text = text.join "\n\n"

    html = latexjs.parse text, { generator: generator } .html!

    if program.entities
        html = he.encode html, 'allowUnsafeSymbols': true

    if program.pretty
        html = beautify-html html,
            'end_with_newline': true
            'wrap_line_length': 120
            'wrap_attributes' : 'auto'
            'unformatted': ['span']

    if program.output
        fs.writeFileSync program.output, html
    else
        process.stdout.write html + '\n'
