'use strict'

require! {
    path
    he
}

const HtmlGenerator   = require '../dist/html-generator' .HtmlGenerator
const html-beautify   = require 'js-beautify' .html
const latexjs         = require '../dist/latex-parser'
const load-fixtures   = require './lib/load-fixtures' .load



describe 'LaTeX.js fixtures', !->
    const fixture_path = path.join(__dirname, 'fixtures')
    const fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) !->
        const desc = path.relative fixture_path, filefixtures.file

        describe desc, !->
            filefixtures.fixtures.forEach (fixture) !->

                _test = test

                # "!": run all tests except those that start with "!", i.e., disable a test by prefixing it with "!"
                # "+": run only those tests that start with "+"

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
                _test fixture.header || 'fixture number ' + fixture.id, !->
                    try
                        html-is     = latexjs.parse fixture.source, { generator: new HtmlGenerator { hyphenate: false } } .domFragment!.outerHTML
                        html-should = fixture.result
                    catch
                        if e.location
                            e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                                        fixture.source.split(//\r\n|\n|\r//)[e.location.start.line - 1]
                        throw e

                    html-is = he.decode html-is.replace //\r\n|\n|\r//g, ""
                    html-should = he.decode html-should.replace //\r\n|\n|\r//g, ""

                    # html-is = html-beautify html-is
                    # html-should = html-beautify html-should
                    expect html-is .to.equal html-should


                # create screenshot test
                if screenshot
                    _test '   - screenshot', ->>
                        html = latexjs.parse fixture.source, { generator: new HtmlGenerator { hyphenate: false } } .htmlDocument!.outerHTML
                        await page.setContent html
                        await page.addStyleTag content: ".body { border: .4px solid; height: max-content; }"

                        filename = path.join __dirname, 'screenshots', desc + ' ' + fixture.header
                        filename = filename.replace /\*/g, '-'

                        takeScreenshot filename
