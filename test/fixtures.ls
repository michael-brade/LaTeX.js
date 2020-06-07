'use strict'

require! 'svgdom': { createHTMLWindow }

global.window = createHTMLWindow!
global.document = window.document

require! {
    path
    fs
    he
    slugify
    'child_process': { spawn }

    '../dist/latex': { parse, HtmlGenerator }

    decache
}

const html-beautify   = require 'js-beautify' .html
const load-fixture    = require './lib/load-fixtures' .load
const registerWindow  = require '@svgdotjs/svg.js' .registerWindow


function reset-svg-ids ()
    decache '@svgdotjs/svg.js'
    delete HtmlGenerator.prototype.SVG
    HtmlGenerator.prototype.SVG = require '@svgdotjs/svg.js' .SVG
    registerWindow window, document



subdirs = []

describe 'LaTeX.js fixtures', !->
    const fixtures-path = path.join __dirname, 'fixtures'

    fs.readdirSync(fixtures-path).forEach (name) ->
        fixture-file = path.join fixtures-path, name
        stat = fs.statSync fixture-file
        if stat.isDirectory!
            subdirs.push name
            return

        describe name, !->
            load-fixture fixture-file .fixtures.forEach (fixture) !->
                run-fixture fixture, name

    # now do the subdirs
    subdirs.forEach (dir) !->
        describe dir, !->
            fs.readdirSync(path.join fixtures-path, dir).forEach (name) !->
                describe name, !->
                    fixture-file = path.join fixtures-path, dir, name
                    load-fixture fixture-file .fixtures.forEach (fixture) !->
                        run-fixture fixture, dir + " - " + name



function run-fixture (fixture, name)
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
        reset-svg-ids!

        try
            generator = parse fixture.source, { generator: new HtmlGenerator { hyphenate: false } }

            div = document.createElement 'div'
            div.appendChild generator.domFragment!.cloneNode true
            html-is = div.innerHTML
            html-should = fixture.result
        catch
            if e.location
                e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                            fixture.source.split(//\r\n|\n|\r//)[e.location.start.line - 1]
            throw e

        html-is = he.decode html-is.replace //\r\n|\n|\r//g, ""
        html-should = he.decode html-should.replace //\r\n|\n|\r//g, ""

        if html-is is not html-should
            filename = path.join __dirname, 'html', slugify(name + ' ' + fixture.header, {
                remove: /[*+~()'"!:@,{}\\]/g
            })
            try fs.mkdirSync path.dirname filename
            fs.writeFileSync filename, html-is

        # html-is = html-beautify html-is
        # html-should = html-beautify html-should
        expect html-is .to.equal html-should


    # create screenshot test
    if screenshot
        _test '   - screenshot', ->>
            reset-svg-ids!

            htmlDoc = parse fixture.source, {
                generator: new HtmlGenerator { hyphenate: false }
            } .htmlDocument!

            # create null favicon to make the browser stop looking for one
            favicon = document.createElement "link"
            favicon.rel = "icon"
            favicon.href = "data:;base64,iVBORw0KGgo="

            htmlDoc.head.appendChild favicon

            filename = path.join __dirname, 'screenshots', slugify(name + ' ' + fixture.header, { remove: /[*+~()'"!:@,{}\\]/g })

            await takeScreenshot htmlDoc.documentElement.outerHTML, filename

            # update native LaTeX screenshot
            # latex-screenshot fixture.source, filename


function latex-screenshot (source, filename)
    const process = spawn (path.join __dirname, 'latex2png.sh'), [filename + ".latex.png"]

    stdout = ""
    stderr = ""

    process.stdout.on 'data', (data) ->
        stdout += data.toString!

    process.stderr.on 'data', (data) ->
        stderr += data.toString!

    process.on 'exit', (code, signal) ->
        if code != 0
            console.warn "latex screenshot failed: " + code
            console.log "#### std err output: " + stderr

    process.on 'error', (err) ->
        process.removeAllListeners 'exit'
        console.warn "latex screenshot failed: " + err

    process.stdin.write source
    process.stdin.end!