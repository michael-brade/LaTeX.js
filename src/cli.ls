``#!/usr/bin/env node``

# on the server we need to include a DOM implementation - BEFORE requiring HtmlGenerator below
require! 'svgdom': { createHTMLWindow, config }

global.window = createHTMLWindow!
global.document = window.document

require! {
    util
    path
    'fs-extra': fs
    stdin
    commander: program
    'js-beautify': { html: beautify-html }

    '../dist/latex.js': { he, parse, HtmlGenerator }

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
    .name           info.name
    .version        info.version
    .description    info.description

    .usage '[options] [files...]'


    .option '-o, --output <file>',      'specify output file, otherwise STDOUT will be used'
    .option '-a, --assets [dir]',       'copy CSS and fonts to the directory of the output file, unless dir is given (default: no assets are copied)'
    .option '-u, --url <base URL>',     'set the base URL to use for the assets (default: use relative URLs)'

    # options affecting the HTML output
    .option '-b, --body',               'don\'t include HTML boilerplate and CSS, only output the contents of body'
    .option '-e, --entities',           'encode HTML entities in the output instead of using UTF-8 characters'
    .option '-p, --pretty',             'beautify the html (this may add/remove spaces unintentionally)'

    # options about LaTeX and style
    .option '-c, --class <class>',      'set a default documentclass for documents without a preamble', 'article'
    .option '-m, --macros <file>',      'load a JavaScript file with additional custom macros'
    .option '-s, --stylesheet <url>',   'specify an additional style sheet to use (can be repeated)', addStyle

    .option '-n, --no-hyphenation',     'don\'t insert soft hyphens (disables automatic hyphenation in the browser)'
    .option '-l, --language <lang>',    'set hyphenation language', 'en'


    .on '--help', -> console.log '\nIf no input files are given, STDIN is read.'

    .parse process.argv



if program.macros
    macros = path.resolve process.cwd!, that
    CustomMacros = (require macros)
    if CustomMacros.default
        # class is the default export
        CustomMacros = that
    else
        # class is a named export
        CustomMacros = CustomMacros[path.parse macros .name]


if program.body and (program.stylesheet or program.url)
    console.error "error: conflicting options: 'url' and 'stylesheet' cannot be used with 'body'!"
    process.exit 1


const options =
    hyphenate:          program.hyphenation
    languagePatterns:   switch program.language
                        | 'en' => en
                        | 'de' => de
                        | otherwise console.error "error: language '#{that}' is not supported yet"; process.exit 1
    documentClass:      program.class
    CustomMacros:       CustomMacros
    styles:             program.style || []





const readFile = util.promisify(fs.readFile)

if program.args.length
    input = Promise.all program.args.map (file) -> readFile file
else
    input = new Promise (resolve, reject) !-> stdin (str) !-> resolve str


input.then (text) ->
    if text.join
        text = text.join "\n\n"

    generator = parse text, { generator: new HtmlGenerator(options) }

    if program.body
        div = document.createElement 'div'
        div.appendChild generator.domFragment!.cloneNode true
        html = div.innerHTML
    else
        html = generator.htmlDocument(program.url).documentElement.outerHTML

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
.catch (err) ->
    console.error err.toString!
    process.exit 1


# assets
dir = program.assets

if program.assets == true
    if not program.output
        console.error "assets error: either a directory has to be given, or -o"
        process.exit 1
    else
        dir = path.posix.dirname path.resolve program.output
else if fs.existsSync(dir) and not fs.statSync(dir).isDirectory!
    console.error "assets error: the given path exists but is not a directory: ", dir
    process.exit 1

if dir
    css = path.join dir, 'css'
    fonts = path.join dir, 'fonts'
    js = path.join dir, 'js'

    fs.mkdirpSync css
    fs.mkdirpSync fonts
    fs.mkdirpSync js

    fs.copySync (path.join __dirname, '../dist/css'), css
    fs.copySync (path.join __dirname, '../dist/fonts'), fonts
    fs.copySync (path.join __dirname, '../dist/js'), js
    fs.copySync (path.join __dirname, '../node_modules/katex/dist/fonts/'), fonts, (src) -> src == /\.woff$/ or fs.statSync(src).isDirectory!
