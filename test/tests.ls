'use strict'

require! {
    path
    puppeteer
}

# on the server we need to include a DOM implementation
global.document = require 'domino' .createDocument!

const HtmlGenerator   = require '../dist/html-generator' .HtmlGenerator
const html-beautify   = require 'js-beautify' .html
const latexjs         = require '../dist/latex-parser'
const load-fixtures   = require './load-fixtures' .load


var browser, page

before !->>
    browser := await puppeteer.launch { devtools: false, dumpio: false }
    page := await browser.newPage!
    await page.goto "file://" + process.cwd! + "/src"

    page.on 'console', (msg) ->
        for i til msg.args.length
            console.log "#{i}: #{msg.args[i]}"


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
                        html-should = fixture.result.text.replace //\n//g, ""
                    catch
                        if e.location
                            e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                                        fixture.source.text.split(/\r\n|\n|\r/)[e.location.start.line - 1]
                        throw e

                    #html-is = html-beautify html-is
                    expect html-is .to.equal html-should

                # create screenshot test
                if screenshot
                    _test '   - screenshot', !->>
                        html = latexjs.parse fixture.source.text, { generator: new HtmlGenerator { hyphenate: false } } .html!
                        page.setContent html
                        await page.screenshot { path: path.join __dirname, "screenshots", desc + ' ' + fixture.header + '.new.png' }


after !->>
    await browser.close!
