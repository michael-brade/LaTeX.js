'use strict'

require! {
    path
    fs
    he
    slugify
}

const html-beautify   = require 'js-beautify' .html
const latexjs         = require '../dist/latex'
const load-fixture    = require './lib/load-fixtures' .load
const decache         = require 'decache'
const registerWindow  = require '@svgdotjs/svg.js' .registerWindow
const HtmlGenerator   = latexjs.HtmlGenerator


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
        decache '@svgdotjs/svg.js'
        delete HtmlGenerator.prototype.SVG
        HtmlGenerator.prototype.SVG = require '@svgdotjs/svg.js' .SVG
        registerWindow window, document


        try
            html-is     = latexjs.parse fixture.source, { generator: new HtmlGenerator { hyphenate: false } } .domFragment!.outerHTML
            html-should = fixture.result
        catch
            if e.location
                e.message = "#{e.message} at line #{e.location.start.line} (column #{e.location.start.column}): " +
                            fixture.source.split(//\r\n|\n|\r//)[e.location.start.line - 1]
            throw e

        html-is = he.decode html-is.replace //\r\n|\n|\r//g, ""
        html-should = he.decode html-should.replace //\r\n|\n|\r//g, ""

        if html-is is not html-should
            filename = path.join __dirname, 'html', slugify(name + ' ' + fixture.header)
            filename = filename.replace /\*/g, '-'
            try fs.mkdirSync path.dirname filename
            fs.writeFileSync filename, html-is

        # html-is = html-beautify html-is
        # html-should = html-beautify html-should
        expect html-is .to.equal html-should


    # create screenshot test
    if screenshot
        _test '   - screenshot', ->>
            html = latexjs.parse fixture.source, {
                generator: new HtmlGenerator { hyphenate: false }
            } .htmlDocument!.outerHTML

            filename = path.join __dirname, 'screenshots', slugify(name + ' ' + fixture.header, { remove: /[*+~()'"!:@,{}\\]/g })

            await takeScreenshot html, filename
