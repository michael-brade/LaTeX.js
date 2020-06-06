[![NPM version](https://img.shields.io/npm/v/latex.js.svg?style=plastic)](https://www.npmjs.org/package/latex.js)
[![NPM downloads](https://img.shields.io/npm/dm/latex.js.svg?style=plastic)](https://www.npmjs.org/package/latex.js)
[![CircleCI](https://img.shields.io/circleci/project/github/michael-brade/LaTeX.js.svg?style=plastic)](https://circleci.com/gh/michael-brade/LaTeX.js)
[![codecov](https://codecov.io/gh/michael-brade/LaTeX.js/branch/master/graph/badge.svg)](https://codecov.io/gh/michael-brade/LaTeX.js)
[![Maintainability](https://api.codeclimate.com/v1/badges/f2ab8b70a87a9da55189/maintainability)](https://codeclimate.com/github/michael-brade/LaTeX.js/maintainability)
[![License](https://img.shields.io/github/license/michael-brade/LaTeX.js.svg?style=plastic)](https://github.com/michael-brade/LaTeX.js/blob/master/LICENSE)


# LaTeX to HTML5 translator using a PEG.js parser

This is a LaTeX to HTML5 translator written in JavaScript using PEG.js.
`latex.js` for LaTeX is similar in spirit to `marked` for Markdown.

LaTeX.js tries to be absolutely and uncompromisingly exact and compatible with LaTeX.
The generated HTML is exactly what is meant to be output, down to the last
space. The CSS makes it look like LaTeX output&mdash;except where impossible in principle,
see limitations.

You can play with it here:
[http://latex.js.org/playground.html](http://latex.js.org/playground.html)


## Installation

For CLI usage install it globally:

```
npm install -g latex.js
```

For library usage add it to your project:

```
npm install --save-prod latex.js
```

## Documentation

You can find the full documentation on the website: [https://latex.js.org/](https://latex.js.org/)

## Alternatives

If you need a LaTeX to HTML translator that also understands TeX to some extent, take a look at:

* [TeX4ht](https://tug.org/applications/tex4ht/mn.html) (TeX)
* [LaTeXML](https://github.com/brucemiller/LaTeXML) (Perl)
* [LaTeX2HTML](https://github.com/latex2html/latex2html) (Perl)
* ~~[HEVEA](http://hevea.inria.fr/) (OCaml)~~
* ~~[plasTeX](https://github.com/tiarno/plastex) (Python)~~

Update: sadly, those last two are nowhere near the quality of LaTeX.js.

There is no such alternative in JavaScript yet, though, which is why I started this project. I want to use it in my
`derby-entities-lib` project.


## License

[![License](https://img.shields.io/github/license/michael-brade/LaTeX.js.svg?style=plastic)](https://github.com/michael-brade/LaTeX.js/blob/master/LICENSE)

Copyright (c) 2015-2020 Michael Brade
