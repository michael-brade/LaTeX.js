# LaTeX.js: A PEG.js Parser to Convert LaTeX Documents to HTML5

This is a simple LaTeX to HTML5 translator written in JavaScript. `latexjs` for LaTeX is similar in spirit to `marked`
for Markdown.


## Usage and Tests

```
npm run build
npm test
```


## Current state, limitations, and TODOs

LaTeX.js only translates LaTeX's structure, you will have to write your CSS yourself or use some predefined CSS once I
provide it. You could think of a documentclass in LaTeX as a CSS file in LaTeX.js.

This parser doesn't aim to be a complete, full-featured TeX/LaTeX to HTML translator for the simple reason that it is a
static parser.



## Alternatives

If you need a more complete LaTeX to HTML translator that really understands TeX, take a look at

* [LaTeXML](https://github.com/brucemiller/LaTeXML) (Perl) or
* [HEVEA](http://hevea.inria.fr/) (OCaml) or
* [plasTeX](https://github.com/tiarno/plastex) (Python).

There is no such alternative in JavaScript yet, though, which is why I started this project. I want to use it in my
`derby-entities-lib` project.


## License

MIT

Copyright (c) 2015 Michael Brade
