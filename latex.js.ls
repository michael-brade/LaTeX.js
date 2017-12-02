require! {
    util
    fs
    commander: program
    'get-stdin': get-stdin

    './dist/latex-parser': latexjs
    './dist/html-generator': HtmlGenerator

    'hyphenation.en-us': en
    'hyphenation.de':    de

    './package.json': info
}

# on the server we need to include a DOM implementation
global.document = require 'domino' .createDocument!


program
    .name info.name
    .version info.version
    .description 'translate a LaTeX document to HTML5'

    .usage '[options] [files...]'

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
    input = readFile(options.file)
else
    input = get-stdin!


input.then (text) ->
    html = latexjs.parse text, { generator: generator } .html!

    if program.output
        fs.writeFileSync file, html
    else
        process.stdout.write html + '\n'
