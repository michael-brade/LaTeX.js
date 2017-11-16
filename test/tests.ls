'use strict'

require! path

html-beautify   = require "js-beautify" .html
latex           = require '../dist/latex-parser'
load-fixtures   = require './load-fixtures' .load


describe 'LaTeX.js fixtures', !->
    fixture_path = path.join(__dirname, 'fixtures')

    fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) ->
        desc = path.relative fixture_path, filefixtures.file

        describe desc, ->
            filefixtures.fixtures.forEach (fixture) ->
                test fixture.header || 'line ' + fixture.first.range.0 - 1, ->
                    html-is     = latex.parse fixture.first.text
                    html-should = fixture.second.text.replace //\n//g, ""
                    #html-is = html-beautify html-is
                    expect html-is .to.equal html-should
