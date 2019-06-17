#!/usr/local/bin/lsc -cj

name: 'latex.js'
description: 'JavaScript LaTeX to HTML5 translator'
version: '0.11.1'

author:
    'name': 'Michael Brade'
    'email': 'brade@kde.org'

keywords:
    'pegjs'
    'latex'
    'parser'
    'html5'

bin:
    'latex.js': './bin/latex.js'

main:
    'dist/index.js'

browser:
    'dist/latex.min.js'

files:
    'bin/latex.js'
    'dist/latex.js'
    'dist/latex.js.map'
    'dist/latex.esm.js'
    'dist/latex.esm.js.map'
    'dist/latex.min.js'
    'dist/latex.min.js.map'
    'dist/latex.esm.min.js'
    'dist/latex.esm.min.js.map'
    'dist/documentclasses/'
    'dist/packages/'
    'dist/css/'
    'dist/fonts/'
    'dist/js/'
    'dist/latex.component.js'

scripts:
    clean: 'rimraf dist bin test/coverage docs/js/playground.bundle.*;'
    build: "
        rimraf 'dist/**/*.js.map';
        mkdirp dist/documentclasses;
        mkdirp dist/packages;
        mkdirp dist/css;
        mkdirp dist/js;
        mkdirp dist/fonts;
        rsync -a src/css/ dist/css/;
        rsync -a src/fonts/ dist/fonts/;
        rsync -a node_modules/katex/dist/fonts/*.woff dist/fonts/;
        rsync -a src/js/ dist/js/;
        cp src/latex.component.js dist/;
        mkdirp bin;
        lsc -bc --no-header -m embedded -p src/cli.ls > bin/latex.js;
        chmod a+x bin/latex.js;
	rollup -c
    "
    docs:  'npm run devbuild && webpack --config-name playground'
    pgcc:  "google-closure-compiler --compilation_level SIMPLE \
                                    --externs src/externs.js \
                                    --js_output_file docs/js/playground.bundle.min.js docs/js/playground.bundle.js;"

    test:  'mocha test/*.ls;'
    iron:  'iron-node node_modules/.bin/_mocha test/*.ls;'

    testc: "
        nyc ./node_modules/.bin/mocha -i -g screenshot --reporter mocha-junit-reporter --reporter-options mochaFile=./test/test-results.xml test/*.ls &&
        mocha -g screenshot --reporter mocha-junit-reporter --reporter-options mochaFile=./test/screenshots/test-results.xml test/*.ls;
    "
    cover: 'nyc report --reporter=html --reporter=text --reporter=lcovonly --report-dir=test/coverage && codecov;'

dependencies:
    'he': '1.2.x'
    'katex': '0.10.0'
    '@svgdotjs/svg.js': '3.x',
    'svgdom': 'https://github.com/michael-brade/svgdom'

    'hypher': '0.x'
    'hyphenation.en-us': '*'
    'hyphenation.de': '*'

    'lodash': '4.x'
    'commander': '2.20.x'
    'stdin': '*'
    'fs-extra': '8.x'
    'js-beautify': '1.10.x'

    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': 'https://github.com/michael-brade/LiveScript'

    ### building

    'pegjs': '0.10.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.6.x'
    'tmp': '0.x'

    ### bundling

    "rollup": "^1.15.5"
    "rollup-plugin-extensions": "^0.1.0"
    "rollup-plugin-pegjs": "^2.1.3"
    "rollup-plugin-livescript": "^0.1.1"
    "rollup-plugin-commonjs": "^10.0.0"
    "rollup-plugin-node-resolve": "^5.0.2"
    "rollup-plugin-terser": "^5.0.0"

    ### testing

    'mocha': '6.x'
    'mocha-junit-reporter': '1.23.x'
    'chai': '4.x'
    'chai-as-promised': '7.x'
    'slugify': '1.3.x'
    'decache': '4.5.x'

    'puppeteer': '1.17.x'
    'puppeteer-firefox': '0.x'
    'pixelmatch': '5.x'

    'nyc': '14.x'
    'codecov': '3.x'

    'serve-handler': '6.x'

repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/LaTeX.js.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/LaTeX.js/issues'

homepage: 'https://latex.js.org'

engines:
    node: '>= 8.0'
