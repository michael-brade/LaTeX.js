#!/usr/local/bin/lsc -cj

name: 'latex.js'
description: 'JavaScript LaTeX to HTML5 translator'
version: '0.8.0'

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

files:
    'bin/latex.js'
    'dist/latex-parser.js'
    'dist/macros.js'
    'dist/symbols.js'
    'dist/html-generator.js'


scripts:
    clean: 'rimraf dist bin;'
    build: "
        mkdirp dist/documentclasses;
        lsc -cp    src/plugin-pegjs.ls          | uglifyjs -cm -o dist/plugin-pegjs.js;
        pegjs --plugin ./dist/plugin-pegjs -o - \
                 src/latex-parser.pegjs         | uglifyjs -cm -o dist/latex-parser.js;
        lsc -cp  src/macros.ls                  | uglifyjs -cm -o dist/macros.js;
        lsc -cp  src/symbols.ls                 | uglifyjs -cm -o dist/symbols.js;
        lsc -cp  src/html-generator.ls          | uglifyjs -cm -o dist/html-generator.js;
        lsc -cp  src/documentclasses/base.ls    | uglifyjs -cm -o dist/documentclasses/base.js;
        lsc -cp  src/documentclasses/article.ls | uglifyjs -cm -o dist/documentclasses/article.js;
        lsc -cp  src/documentclasses/book.ls    | uglifyjs -cm -o dist/documentclasses/book.js;
        lsc -cp  src/documentclasses/report.ls  | uglifyjs -cm -o dist/documentclasses/report.js;

        mkdirp bin;
        lsc -bc --no-header -o bin src/latex.js.ls;
    "
    devbuild: "
        mkdirp dist/documentclasses;
        lsc -c -o dist src/plugin-pegjs.ls src/symbols.ls src/macros.ls src/html-generator.ls;
        lsc -c -o dist/documentclasses src/documentclasses/;
        pegjs -o dist/latex-parser.js --plugin ./dist/plugin-pegjs src/latex-parser.pegjs;
    "
    docs:  'npm run devbuild && webpack && uglifyjs -cm -o docs/js/playground.bundle.pack.js docs/js/playground.bundle.js;'
    pgcc:  "google-closure-compiler --compilation_level SIMPLE \
                                    --externs src/externs.js \
                                    --js_output_file docs/js/playground.bundle.pack.js docs/js/playground.bundle.js;"
    test:  'mocha test/_*.ls test/tests.ls;'
    iron:  'iron-node node_modules/.bin/_mocha test/_*.ls test/tests.ls;'
    cover: 'istanbul cover --dir test/coverage _mocha test/_*.ls test/tests.ls;'

babel:
    plugins:
        '@babel/syntax-object-rest-spread'
        ...


dependencies:
    'domino': '2.x'
    'he': '1.1.x'
    'katex': '0.9.0-alpha'
    'svg.js': '2.6.x'

    'hypher': '0.x'
    'hyphenation.en-us': '*'
    'hyphenation.de': '*'

    'commander': '2.13.x'
    'stdin': '*'
    'js-beautify': '1.7.x'

    #'lodash': '4.x'
    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': 'https://github.com/gkz/LiveScript'

    ### building

    'pegjs': '0.10.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.6.x'
    'uglify-js': '3.3.x'


    ### bundling

    'webpack': '3.10.x'
    'babel-loader': '8.0.0-beta.0'
    'copy-webpack-plugin': '4.3.x'

    '@babel/core': '7.0.0-beta.33'
    '@babel/register': '7.0.0-beta.33'
    '@babel/plugin-syntax-object-rest-spread': '7.0.0-beta.33'


    ### testing

    'mocha': '5.x'
    'chai': '4.x'
    'chai-as-promised': '7.x'

    'puppeteer': '^1.0.0'
    'resemblejs': '^2.6.0'

    'istanbul': '>= 0.4.x'


repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/LaTeX.js.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/LaTeX.js/issues'

homepage: 'https://github.com/michael-brade/LaTeX.js#readme'

engines:
    node: '>= 8.0'
