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

    fixtures.forEach (filefixtures) ->
        desc = path.relative fixture_path, filefixtures.file

        describe desc, ->
            filefixtures.fixtures.forEach (fixture) ->
                test fixture.header || 'line ' + fixture.first.range.0 - 1, ->
                    html-is     = latexjs.parse fixture.first.text, {
                        generator: new HtmlGenerator { hyphenate: false }
                    } .html!
                    html-should = fixture.second.text.replace //\n//g, ""
                    #html-is = html-beautify html-is
                    expect html-is .to.equal html-should
