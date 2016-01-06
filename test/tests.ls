'use strict'

require! path

html-beautify   = require "js-beautify" .html
latex           = require '../dist/latex-parser'
load-fixtures   = require './load-fixtures' .load


describe 'pegjs-latex fixtures', !->
    fixture_path = path.join(__dirname, 'fixtures')

    fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) ->
        desc = path.relative fixture_path, filefixtures.file

        describe desc, ->
            filefixtures.fixtures.forEach (fixture) ->
                test fixture.header || 'line ' + fixture.first.range.0 - 1, ->
                    html = latex.parse fixture.first.text
                    html = html.replace //><([^/])//g, ">\n<$1"     # beautify: begin opening tags on a new line
                    expect html .to.equal fixture.second.text
