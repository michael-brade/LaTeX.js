'use strict'

require! path

latex = require('../dist/latex-parser')
load-fixtures = require('./load-fixtures').load


describe 'pegjs-latex fixtures', !->
    fixture_path = path.join(__dirname, 'fixtures/whitespace.tex')

    fixtures = load-fixtures fixture_path

    fixtures.forEach (filefixtures) ->
        desc = path.relative fixture_path, filefixtures.file

        describe desc, ->
            filefixtures.fixtures.forEach (fixture) ->
                test fixture.header || 'line ' + fixture.first.range.0 - 1, ->
                    expect(latex.parse fixture.first.text).to.equal fixture.second.text
