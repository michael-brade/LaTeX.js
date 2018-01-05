'use strict'

require! path

# on the server we need to include a DOM implementation
global.document = require 'domino' .createDocument!

HtmlGenerator   = require '../dist/html-generator' .HtmlGenerator
html-beautify   = require 'js-beautify' .html
latexjs         = require '../dist/latex-parser'
load-fixtures   = require './load-fixtures' .load


describe 'LaTeX.js fixtures', !->
    fixture_path = path.join(__dirname, 'fixtures')

    fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) !->
        desc = path.relative fixture_path, filefixtures.file

        describe desc, !->
            filefixtures.fixtures.forEach (fixture) !->
                # disable a test by prefixing it with !
                if fixture.header?.charAt(0) == "!"
                    t = test.skip
                else
                    t = test

                # create a test
                t fixture.header || 'line ' + (fixture.first.range.0 - 1), !->
                    try
                        html-is     = latexjs.parse fixture.first.text, { generator: new HtmlGenerator { hyphenate: false } } .html!
                        html-should = fixture.second.text.replace //\n//g, ""
                    catch
                        if e.location
                            e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                                        fixture.first.text.split(/\r\n|\n|\r/)[e.location.start.line - 1]
                        throw e

                    #html-is = html-beautify html-is
                    expect html-is .to.equal html-should
