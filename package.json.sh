#!/usr/local/bin/lsc -cj

name: 'latex.js'
description: 'JavaScript LaTeX to HTML5 translator'
version: '0.5.0'

author:
    'name': 'Michael Brade'
    'email': 'brade@kde.org'

keywords:
    'pegjs'
    'latex'
    'parser'
    'html5'


main:
    'dist/latex-parser.js'

bin:
    'latex.js': './bin/latex.js'


scripts:
    clean: 'rimraf dist bin;'
    build: "
        mkdirp dist;
        mkdirp bin;
        pegjs -o dist/latex-parser.js src/latex-parser.pegjs;
        lsc -c -o dist src/html-generator.ls;
        lsc -c -o bin latex.js.ls;
    "
    bundle:'npm run build && webpack;'
    pack:  'google-closure-compiler --compilation_level SIMPLE --externs src/externs.js --js_output_file docs/js/playground.bundle.pack.js docs/js/playground.bundle.js;'
    test:  'mocha test/_*.ls test/tests.ls;'
    iron:  'iron-node node_modules/.bin/_mocha test/_*.ls test/tests.ls;'
    cover: 'istanbul cover --dir test/coverage _mocha test/_*.ls test/tests.ls;'

babel:
    plugins:
        '@babel/syntax-object-rest-spread'
        ...


dependencies:
    'domino': '2.x'
    'entities': '1.x'
    'katex': '0.9.0-alpha'

    'hypher': '0.x'
    'hyphenation.en-us': '*'
    'hyphenation.de': '*'

    'get-stdin': '5.x'
    #'lodash': '4.x'
    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': '1.5.x'

    ### building

    'pegjs': '0.10.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.6.x'


    ### bundling

    'webpack': '3.9.x'
    'babel-loader': '8.0.0-beta.0'
    'copy-webpack-plugin': '4.2.x'

    '@babel/core': '7.0.0-beta.33'
    '@babel/register': '7.0.0-beta.33'
    '@babel/plugin-syntax-object-rest-spread': '7.0.0-beta.33'


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
