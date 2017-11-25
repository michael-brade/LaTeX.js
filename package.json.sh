#!/usr/local/bin/lsc -cj

name: 'latexjs'
description: 'A simple PEG.js parser for LaTeX'
version: '0.3.0'

author:
    'name': 'Michael Brade'
    'email': 'brade@kde.org'

keywords:
    'pegjs'
    'latex'
    'parser'


scripts:
    clean: 'rimraf dist;'
    build: 'mkdirp dist && pegjs -o dist/latex-parser.js src/latex-parser.pegjs && lsc -c -o dist src/html-generator.ls'
    bundle:'webpack'
    test:  'mocha test/_*.ls test/tests.ls;'
    iron:  'iron-node node_modules/.bin/_mocha test/_*.ls test/tests.ls;'
    cover: 'istanbul cover --dir test/coverage _mocha test/_*.ls test/tests.ls;'

babel:
    presets:
        "es2015"

    plugins:
        "transform-object-rest-spread"


dependencies:
    'domino': '2.x'
    'entities': '1.x'
    'lodash': '4.x'
    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': '1.5.x'

    ### building

    'pegjs': '0.10.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.6.x'


    ### bundling

    'webpack': '3.8.x'
    'babel-loader': '7.1.x'
    'babel-core': '6.26.x'
    # babel-preset-env '1.6.x'
    'babel-preset-es2015': '6.24.x'
    'babel-plugin-transform-object-rest-spread': '6.26.x'


    ### testing

    'mocha': '4.x'
    'chai': '4.x'
    'chai-as-promised': '7.x'
    'js-beautify': '1.7.x'

    'istanbul': '>= 0.4.x'


repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/LaTeX.js.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/LaTeX.js/issues'

homepage: 'https://github.com/michael-brade/LaTeX.js#readme'
