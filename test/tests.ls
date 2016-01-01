'use strict'

require! path

latex = require('../dist/latex')
fixtures = require('./_runner')


describe 'pegjs-latex fixtures', !->
    fixtures path.join(__dirname, 'fixtures/whitespace.tex'), { header: true }, latex.parse
