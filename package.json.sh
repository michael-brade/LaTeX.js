#!/usr/local/bin/lsc -cj

name: 'pegjs-latex'
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
    build: 'mkdirp dist; pegjs src/latex.pegjs dist/latex.js; lsc -c -o dist src/compiler.ls'
    test: 'mocha;'


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


repository:
    type: 'git'
    url: 'git+https://github.com/michael-brade/pegjs-latex.git'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/pegjs-latex/issues'

homepage: 'https://github.com/michael-brade/pegjs-latex#readme'
