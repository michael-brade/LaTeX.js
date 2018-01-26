'use strict'

require! path

# on the server we need to include a DOM implementation
global.document = require 'domino' .createDocument!

const HtmlGenerator   = require '../dist/html-generator' .HtmlGenerator
const html-beautify   = require 'js-beautify' .html
const latexjs         = require '../dist/latex-parser'
const load-fixtures   = require './load-fixtures' .load


describe 'LaTeX.js fixtures', !->
    const fixture_path = path.join(__dirname, 'fixtures')
    const fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) !->
        const desc = path.relative fixture_path, filefixtures.file

        describe desc, !->
            filefixtures.fixtures.forEach (fixture) !->
                # disable a test by prefixing it with !
                if fixture.header?.charAt(0) == "!"
                    t = test.skip
                else
                    t = test

                # create syntax test
                t fixture.header || 'line ' + (fixture.source.range.0 - 1), !->
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
