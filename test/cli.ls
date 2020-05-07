'use strict'

require! { path, fs }
require! '../package': pkg
require! 'os': { EOL }

require! tmp
require! './lib/cmd'

const binFile = path.resolve pkg.bin[pkg.name]
const latexjs = cmd.create binFile



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
            expect(latexjs.execute ['-b -s style.css']).to.eventually.be.rejected
        ]

    test 'default translation', ->
        expect(latexjs.execute [], [ "A paragraph." ])
            .to.eventually.be.fulfilled
            .and.to.be.an 'object' .that.includes.key 'stdout'
            .and.to.satisfy (res) ->
               expect(res.stdout).to.equal('<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>A para­graph.</p></div></body></html>' + EOL)

    test 'return only the body', ->
        expect(latexjs.execute ['-b'], [ "A paragraph." ])
            .to.eventually.be.fulfilled
            .and.to.be.an 'object' .that.includes.key 'stdout'
            .and.to.satisfy (res) -> res.stdout == '<div class="body"><p>A para­graph.</p></div>' + EOL

    test 'include custom macros', ->
        tmpfile = tmp.fileSync!
        macroCode = require('livescript').compile(fs.readFileSync 'test/api/CustomMacros.ls', 'utf8')
        fs.writeSync tmpfile.fd, macroCode

        expect(latexjs.execute ['-b', '-m', tmpfile.name], [ "A \\myMacro[custom] macro." ])
            .to.eventually.be.fulfilled
            .and.to.satisfy (res) -> res.stdout == '<div class="body"><p>A -cus­tom- macro.</p></div>' + EOL
