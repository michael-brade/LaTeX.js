<style>
span.tex span,
span.latex span {
    text-transform: uppercase;
}

span.latex span:first-child {
    font-size: 0.8em;
    vertical-align: 0.2em;
    margin-left:  -0.45em;
    margin-right: -0.15em;
}

span.tex span:first-child,
span.latex span:last-child {
    margin-left: -0.2em;
    margin-right: -0.2em;
    position: relative;
    top: 0.45ex;
}
</style>

# A PEG.js Parser to Convert <span class="latex">L<span>a</span>T<span>e</span>X</span> Documents to HTML5

This is a <span class="latex">L<span>a</span>T<span>e</span>X</span> to HTML5 translator written in JavaScript using PEG.js.
`latex.js` for <span class="latex">L<span>a</span>T<span>e</span>X</span> is similar in spirit to `marked` for Markdown.

<span class="latex">L<span>a</span>T<span>e</span>X</span>.js is absolutely and uncompromisingly exact and compatible 
with <span class="latex">L<span>a</span>T<span>e</span>X</span>, the generated HTML is exactly what is meant to be output,
down to the last space.

You can play with it here: [http://michael-brade.github.io/LaTeX.js/playground.html](http://michael-brade.github.io/LaTeX.js/playground.html)


## Usage and Tests

To build it and run the tests, execute:
```
npm run build
npm test
```

<span class="latex">L<span>a</span>T<span>e</span>X</span>.js only translates <span class="latex">L<span>a</span>T<span>e</span>X</span>'s 
structure, you will have to write your CSS yourself or use some of the predefined CSS I started to provide. Think of a documentclass in 
<span class="latex">L<span>a</span>T<span>e</span>X</span> as a CSS file in <span class="latex">L<span>a</span>T<span>e</span>X</span>.js.


## Features

See the showcase on the [playground](http://michael-brade.github.io/LaTeX.js/playground.html) for a description of most of
the features. If you want to see all the obscure edge cases <span class="latex">L<span>a</span>T<span>e</span>X</span>.js 
supports, you will have to look at the unit tests. 


## Limitations of <span class="latex">L<span>a</span>T<span>e</span>X</span>.js due to HTML and CSS

The following features just cannot be translated to HTML:

* `\hfill` in a paragraph of text is not possible
* `\vspace{}` with a negative value in horizontal mode, i.e. in the middle of a paragraph of text, is not possible (useless anyway)


## Limitations when parsing <span class="tex">T<span>e</span>X</span> as a context-free grammar

This is a PEG parser, which means it interprets <span class="latex">L<span>a</span>T<span>e</span>X</span> as a context-free language.
However, <span class="tex">T<span>e</span>X</span> (and therefore <span class="latex">L<span>a</span>T<span>e</span>X</span>) is
Turing complete, so <span class="tex">T<span>e</span>X</span> can only really be parsed by a complete Turing machine. It is not 
possible to parse the full <span class="tex">T<span>e</span>X</span> language with a static parser. See 
[here](https://tex.stackexchange.com/questions/4201/is-there-a-bnf-grammar-of-the-tex-language) for some interesting examples.

It is even undecidable wheather a <span class="tex">T<span>e</span>X</span> program has a parse tree. There has been done some research
on the problem of parsing <span class="tex">T<span>e</span>X</span>, see [here](http://www.mathematik.uni-marburg.de/~seba/publications/sle10.pdf).

To quote the four problems of <span class="tex">T<span>e</span>X</span>:

* Since <span class="tex">T<span>e</span>X</span> has dynamic scoping, it is not possible to determine statically
  wheather `a` is an argument to `\app` in `\app a` or just another letter. It depends on the definition of `\app` at runtime.

* Macros can be passed as arguments to other macros, further complicating this problem. E.g.:
  ```tex
  \def\app #1 #2 {#1 #2}
  \def\id #1 {#1}
  \app a b
  \app \id c
  ```
  Thus, targets of macro calls can in general not be determined statically.

* <span class="tex">T<span>e</span>X</span> has a lexical macro system, which means macro bodies do not have to be syntactically correct pieces
  of <span class="tex">T<span>e</span>X</span> code. Also, macros can expand to new macro definitions.

* Tex allows custom macro call syntax. Basically, any syntax could be changed.


I therefore take a slightly different approach:

* First, I don't care about <span class="tex">T<span>e</span>X</span>, but only <span class="latex">L<span>a</span>T<span>e</span>X</span>,
  and most <span class="latex">L<span>a</span>T<span>e</span>X</span> documents do not use <span class="tex">T<span>e</span>X</span> syntax, 
  or `\def` in particular. Therefore, this parser assumes standard <span class="latex">L<span>a</span>T<span>e</span>X</span> syntax and 
  catcodes, and parses that statically.

* Second, for now there is no way of defining macros, only expanding macros is supported. So if a new 
  <span class="latex">L<span>a</span>T<span>e</span>X</span> macro is needed, reimplement it in JavaScript directly,
  thus circumventing the problem altogether.

* Third, I don't care about formal correctness of my syntax tree. If a custom macro, say, takes only one argument and
  `\foo{a}{b}` is encountered, both arguments are passed to the JavaScript function `foo`, which then leaves `b`
  untouched, simply returning it along with its own result. This parser does not know about the arity of custom macros
  (defined only in JavaScript), it assumes that the author of a macro call knows it. So ideally, macros should be
  defined in the PEG.js grammar.



### Expansion and Execution

Additionally, this parser does not implement <span class="tex">T<span>e</span>X</span>'s distinction of expansion and
execution. I am not yet sure if I need to implement it at all. Right now, there is only one phase that takes a macro 
and returns an HTML fragment.

Skipped spaces and macros that expand to a macro taking a parameter further down in the input provide a good
illustration of why <span class="tex">T<span>e</span>X</span> makes this distinction. Consider the commands
```tex
\def\a{\penalty200}
\a 0
```
This is not equivalent to
```tex
\penalty200 0
```
which would place a penalty of 200, and typeset the digit 0. Instead, it expands to
```tex
\penalty2000
```
because the space after \a is skipped in the input processor. Later stages of processing then receive the sequence
```tex
\a0
```
However, <span class="latex">L<span>a</span>T<span>e</span>X</span> documents themselves usually don't rely on or need this feature--that is, until I'm convinced otherwise.



#### TODO

Maybe:

 * [ ] implement the output using <span class="tex">T<span>e</span>X</span>'s original linebreaking algorithm: https://github.com/bramstein/typeset




## Alternatives

If you need a more complete <span class="latex">L<span>a</span>T<span>e</span>X</span> to HTML translator that really understands <span class="tex">T<span>e</span>X</span>, take a look at

* [<span class="latex">L<span>a</span>T<span>e</span>X</span>ML](https://github.com/brucemiller/LaTeXML) (Perl) or
* [HEVEA](http://hevea.inria.fr/) (OCaml) or
* [plasTeX](https://github.com/tiarno/plastex) (Python).

There is no such alternative in JavaScript yet, though, which is why I started this project. I want to use it in my
`derby-entities-lib` project.


## License

MIT

Copyright (c) 2015-2017 Michael Brade
