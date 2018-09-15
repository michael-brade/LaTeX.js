'use strict'

require! path
require! '../package': pkg
require! 'os': { EOL }

const binFile = path.resolve pkg.bin[pkg.name]
const latexjs = require('./lib/cmd').create binFile


describe 'LaTeX.js CLI test', !->

    test 'get version', ->
        expect(latexjs.execute ['-V']).to.eventually.include.nested { stdout: pkg.version + EOL }

    test 'get help', ->
        expect(latexjs.execute ['-h']).to.eventually.be.fulfilled
                                      .and.to.be.an 'object'
                                      .that.satisfies (h) -> h.stdout.includes pkg.description

    test 'error on unknown option', ->
        expect(latexjs.execute ['-x']).to.eventually.be.rejected
                                      .and.to.be.an 'object' .that.includes.key 'stderr'
                                      .and.to.satisfy (res) -> res.stderr.includes 'error: unknown option'

    test 'error on incorrect use', ->
        Promise.all [
            expect(latexjs.execute ['-b', '-s']).to.eventually.be.rejected
            expect(latexjs.execute ['-b', '-u']).to.eventually.be.rejected
            expect(latexjs.execute ['-bus']).to.eventually.be.rejected
        ]

    test.skip 'TODO: parsing bug in commander', ->
        latexjs.execute ['-b -s style.css'] .then (r) -> console.log r
