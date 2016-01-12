#!/usr/local/bin/lsc -cj

name: 'latexjs'
description: 'A simple PEG.js parser for LaTeX'
version: '0.1.0'

author:
    'name': 'Michael Brade'
    'email': 'brade@kde.org'

keywords:
    'pegjs'
    'latex'
    'parser'


scripts:
    clean: 'rimraf dist;'
    build: 'mkdirp dist; pegjs src/latex-parser.pegjs dist/latex-parser.js; lsc -c -o dist src/html-generator.ls'
    test: 'mocha test/_*.ls test/tests.ls;'
    iron: 'iron-node node_modules/.bin/_mocha test/_*.ls test/tests.ls;'
    cover: 'istanbul cover --dir test/coverage _mocha test/_*.ls test/tests.ls;'


dependencies:
    'domino': '^1.0.21'
    'entities': '1.x'
    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': '1.4.x'

    'browserify': '12.x'
    'babelify': '7.x'


    ### building

    'pegjs': '0.9.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.5.x'


    ### testing

    'mocha': '2.3.x'
    'chai': '3.x'
    'chai-as-promised': '5.x'
    'js-beautify': '1.5.x'

    'istanbul': '>= 0.4.x'


repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/LaTeX.js.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/LaTeX.js/issues'

homepage: 'https://github.com/michael-brade/LaTeX.js#readme'
