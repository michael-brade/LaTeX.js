#!/usr/local/bin/lsc -cj

name: 'latex.js'
description: 'JavaScript LaTeX to HTML5 translator'
version: '0.10.1'

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
    'dist/index.js'
    'dist/latex-parser.js'
    'dist/macros.js'
    'dist/symbols.js'
    'dist/html-generator.js'
    'dist/documentclasses/'
    'dist/css/'
    'dist/fonts/'
    'dist/js/'
    'dist/latex.min.js'


scripts:
    clean: 'rimraf dist bin test/coverage;'
    build: "
        npm run devbuild;
        cd dist;
        uglifyjs latex-parser.js            -cm --source-map 'includeSources,url=\"./latex-parser.js.map\"'                   -o latex-parser.js;

        uglifyjs index.js                   -cm --source-map 'content=inline,includeSources,url=\"./index.js.map\"'           -o index.js;
        uglifyjs macros.js                  -cm --source-map 'content=inline,includeSources,url=\"./macros.js.map\"'          -o macros.js;
        uglifyjs symbols.js                 -cm --source-map 'content=inline,includeSources,url=\"./symbols.js.map\"'         -o symbols.js;
        uglifyjs html-generator.js          -cm --source-map 'content=inline,includeSources,url=\"./html-generator.js.map\"'  -o html-generator.js;

        uglifyjs documentclasses/base.js    -cm --source-map 'content=inline,includeSources,url=\"./base.js.map\"'            -o documentclasses/base.js;
        uglifyjs documentclasses/article.js -cm --source-map 'content=inline,includeSources,url=\"./article.js.map\"'         -o documentclasses/article.js;
        uglifyjs documentclasses/book.js    -cm --source-map 'content=inline,includeSources,url=\"./book.js.map\"'            -o documentclasses/book.js;
        uglifyjs documentclasses/report.js  -cm --source-map 'content=inline,includeSources,url=\"./report.js.map\"'          -o documentclasses/report.js;
        cd ..;
    "
    devbuild: "
        mkdirp dist/documentclasses;
        mkdirp dist/css;
        mkdirp dist/js;
        mkdirp dist/fonts;
        rsync -a src/css/ dist/css/;
        rsync -a src/fonts/ dist/fonts/;
        rsync -a src/js/ dist/js/;
        cp src/latex.component.js dist/;
        lsc -c -m embedded -o dist src/plugin-pegjs.ls src/symbols.ls src/macros.ls src/html-generator.ls;
        lsc -c -m embedded -o dist/documentclasses src/documentclasses/;
        pegjs -o dist/latex-parser.js --plugin ./dist/plugin-pegjs src/latex-parser.pegjs;
        babel -o dist/index.js -s inline src/index.js;

        mkdirp bin;
        lsc -bc --no-header -m embedded -o bin src/latex.js.ls;
        chmod a+x bin/latex.js;
    "
    docs:  'npm run build && webpack'
    pgcc:  "google-closure-compiler --compilation_level SIMPLE \
                                    --externs src/externs.js \
                                    --js_output_file docs/js/playground.bundle.min.js docs/js/playground.bundle.js;"

    test:  'mocha test/*.ls;'
    iron:  'iron-node node_modules/.bin/_mocha test/*.ls;'

    testc: 'nyc ./node_modules/.bin/mocha --reporter mocha-junit-reporter --reporter-options mochaFile=./test/test-results.xml test/*.ls;'
    cover: 'nyc report --reporter=html --reporter=text --reporter=lcovonly --report-dir=test/coverage && codecov;'

babel:
    presets:
        * '@babel/preset-env'
            targets:
                node: 'current'
                browsers: '> 0.5%, not dead'
        ...

    plugins:
        '@babel/syntax-object-rest-spread'
        ...


dependencies:
    'he': '1.1.x'
    'katex': '0.9.0'
    'svg.js': '2.6.x'
    'svgdom': 'https://github.com/michael-brade/svgdom'

    'hypher': '0.x'
    'hyphenation.en-us': '*'
    'hyphenation.de': '*'

    'lodash': '4.x'
    'commander': '2.18.x'
    'stdin': '*'
    'fs-extra': '7.x'
    'js-beautify': '1.8.x'

    #'cheerio': '0.x'
    #'xmldom': '^0.1.19'

devDependencies:
    'livescript': 'https://github.com/michael-brade/LiveScript'

    ### building

    'pegjs': '0.10.x'
    'mkdirp': '0.5.x'
    'rimraf': '2.6.x'
    'uglify-js': '3.4.x'
    'tmp': '0.x'


    ### bundling

    'webpack': '4.x'
    'webpack-command': '0.x'
    'webpack-closure-compiler': '2.x'
    'babel-loader': '8.0.x'
    'source-map-loader': '0.2.x'
    'copy-webpack-plugin': '4.5.x'

    '@babel/cli': '7.0.x'
    '@babel/core': '7.0.x'
    '@babel/register': '7.0.x'
    '@babel/preset-env': '7.0.x'
    '@babel/plugin-syntax-object-rest-spread': '7.0.x'


    ### testing

    'mocha': '5.x'
    'mocha-junit-reporter': '1.18.x'
    'chai': '4.x'
    'chai-as-promised': '7.x'

    'puppeteer': '1.8.x'
    'pixelmatch': '4.0.x'

    'nyc': '13.x'
    'codecov': '3.x'


repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/LaTeX.js.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/LaTeX.js/issues'

homepage: 'https://github.com/michael-brade/LaTeX.js#readme'

engines:
    node: '>= 8.0'
