'use strict'

require! {
    fs
    path
    he
    puppeteer
    pixelmatch
    pngjs: { PNG }
}

# on the server we need to include a DOM implementation
global.window = require 'svgdom'
global.document = window.document


# svgdom.setFontDir '../src/fonts'
#       .setFont

const HtmlGenerator   = require '../dist/html-generator' .HtmlGenerator
const html-beautify   = require 'js-beautify' .html
const latexjs         = require '../dist/latex-parser'
const load-fixtures   = require './load-fixtures' .load


var browser, page

before !->>
    browser := await puppeteer.launch {
        devtools: false
        dumpio: false
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }

    page := (await browser.pages!).0                    # there is always one page available
    await page.goto "file://" + process.cwd! + "/src"   # set the base url

    page.on 'console', (msg) ->
        for i til msg.args.length
            console.log "#{i}: #{msg.args[i]}"

    await page.setViewport { width: 1000, height: 0, deviceScaleFactor: 2 }

after !->>
    await browser.close!


describe 'LaTeX.js fixtures', !->
    const fixture_path = path.join(__dirname, 'fixtures')
    const fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) !->
        const desc = path.relative fixture_path, filefixtures.file

        describe desc, !->
            filefixtures.fixtures.forEach (fixture) !->

                _test = test

                # disable a test by prefixing it with "!", run only some tests by prefixing them with "+"
                if fixture.header?.charAt(0) == "!"
                    _test = test.skip
                    fixture.header = fixture.header.substr 1
                else if fixture.header?.charAt(0) == "+"
                    _test = test.only
                    fixture.header = fixture.header.substr 1

                # make a screenshot by prefixing it with "s"
                if fixture.header?.charAt(0) == "s"
                    screenshot = true
                    fixture.header = fixture.header.substr 1


                # create syntax test
                _test fixture.header || 'line ' + (fixture.source.range.0 - 1), !->
                    try
                        html-is     = latexjs.parse fixture.source.text, { generator: new HtmlGenerator { hyphenate: false, bare: true } } .html!
                        html-should = fixture.result.text
                    catch
                        if e.location
                            e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                                        fixture.source.text.split(/\r\n|\n|\r/)[e.location.start.line - 1]
                        throw e

                    html-is = he.decode html-is.replace //\n//g, ""
                    html-should = he.decode html-should.replace //\n//g, ""

                    # html-is = html-beautify html-is
                    # html-should = html-beautify html-should
                    expect html-is .to.equal html-should


                # create screenshot test
                if screenshot
                    _test '   - screenshot', !->>
                        html = latexjs.parse fixture.source.text, { generator: new HtmlGenerator { hyphenate: false } } .html!
                        await page.setContent html
                        await page.addStyleTag content: ".body { border: .4px solid; height: max-content; }"

                        filename = path.join __dirname, 'screenshots', desc + ' ' + fixture.header
                        filename = filename.replace /\*/g, '-'

                        await page.screenshot {
                            omitBackground: true
                            path: filename + '.new.png'
                        }

                        if fs.existsSync filename + '.png'
                            # now compare the screenshots and delete the new one if they match

                            png1 = PNG.sync.read(fs.readFileSync(filename + '.png'))
                            png2 = PNG.sync.read(fs.readFileSync(filename + '.new.png'))

                            diff = new PNG { width: png1.width, height: png1.height }

                            dfpx = pixelmatch png1.data, png2.data, diff.data, png1.width, png1.height, threshold: 0

                            diff.pack!.pipe(fs.createWriteStream(filename + '.diff.png'))

                            if dfpx > 0
                                throw new Error "screenshots differ by #{dfpx} pixels - see #{filename + '.*.png'}"
                            else
                                fs.unlinkSync filename + '.new.png'
                                fs.unlinkSync filename + '.diff.png'
                        else
                            # if no screenshot exists yet, use this new one
                            fs.renameSync filename + '.new.png', filename + '.png'
