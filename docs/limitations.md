---
id: doc1
title: Latin-ish
sidebar_label: Example Page
---

## Limitations

- I don't create an intermediate AST yet, so TeX's conditional expressions are impossible
- deprecated macros, or macros that are not supposed to be used in LaTeX, won't even exist in LaTeX.js.
  Examples include: `eqnarray`, the old LaTeX 2.09 font macros `\it`, `\sl`, etc. Also missing are most of the plainTeX macros.
  See also [`l2tabuen.pdf`](ftp://ftp.dante.de/tex-archive/info/l2tabu/english/l2tabuen.pdf).
- incorrect but legal markup in LaTeX won't produce the same result in LaTeX.js - like when using `\raggedleft` in the
  middle of a paragraph; but the LaTeX.js result should be intuitively correct.
- because of the limitations when parsing TeX as a context-free grammar (see [below](#parsing-tex)), native LaTeX packages
  cannot be parsed and loaded. Instead, the macros those packages (and documentclasses) provide have to be implemented in
  JavaScript.


## Limitations of LaTeX.js due to HTML and CSS

The following features in LaTeX just cannot be translated to HTML, not even when using JavaScript:

- TeX removes any whitespace from the beginning and end of a line, even consecutive ones that would be printed in the middle
  of a line, like `\ ` or `~` or ^^0020. This is not possible in HTML (yet - maybe it will be with CSS4).
- horizontal glue, like `\hfill` in a paragraph of text, is not possible
- vertical glue makes no sense in HTML, and is impossible to emulate, except in boxes with fixed height
- `\vspace{}` with a negative value in horizontal mode, i.e. in the middle of a paragraph of text, is not possible
  (but this feature is useless anyway)

And the concept of pages does not really apply to HTML, so any macro related to pagebreaks will be ignored. One
could say that splitting a HTML file into multiple files is like a pagebreak, but then, still, it would be much
easier to handle: just choose a break before a new section or paragraph. There is no absolute space limitation
like on a real page.



## <a name="parsing-tex"></a> Limitations when parsing TeX as a context-free grammar

This is a PEG parser, which means it interprets LaTeX as a context-free language. However, TeX (and therefore LaTeX) is
Turing complete, so TeX can only really be parsed by a complete Turing machine. It is not possible to parse the full
TeX language with a static parser. See
[here](https://tex.stackexchange.com/questions/4201/is-there-a-bnf-grammar-of-the-tex-language) for some interesting
examples.

It is even undecidable wheather a TeX program has a parse tree. There has been done some research
on the problem of parsing TeX, see [here](http://www.mathematik.uni-marburg.de/~seba/publications/sle10.pdf).

To quote the four problems of TeX:

- Since TeX has dynamic scoping, it is not possible to determine statically
  wheather `a` is an argument to `\app` in `\app a` or just another letter. It depends on the definition of `\app` at
  runtime.

- Macros can be passed as arguments to other macros, further complicating this problem. E.g.:
  ```tex
  \def\app #1 #2 {#1 #2}
  \def\id #1 {#1}
  \app a b
  \app \id c
  ```
  Thus, targets of macro calls can in general not be determined statically.

- TeX has a lexical macro system, which means macro bodies do not have to be syntactically correct pieces
  of TeX code. Also, macros can expand to new macro definitions.

- Tex allows custom macro call syntax. Basically, any syntax could be changed.


I therefore take a slightly different approach:

- First, I don't care about TeX, but only LaTeX, and most LaTeX documents do not use TeX syntax, or `\def` in
  particular. Therefore, this parser assumes standard LaTeX syntax and catcodes.

- Second, for now there is no way of defining macros, only expanding macros is supported. So if a new
  LaTeX macro is needed, reimplement it in JavaScript directly, thus circumventing the problem altogether.


### Expansion and Execution

Additionally, this parser does not implement TeX's distinction of expansion and
execution. I am not yet sure if I need to implement it at all. Right now, there is only one phase that takes a macro
and returns an HTML fragment.

Skipped spaces and macros that expand to a macro taking a parameter further down in the input provide a good
illustration of why TeX makes this distinction. Consider the commands
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
However, LaTeX documents themselves usually don't rely on or need this feature--that is, until I'm convinced otherwise.

This also means that you cannot use `\vs^^+ip` to have LaTeX.js interpret it as `\vskip`. Again, this is a feature
that most people will probably never need.
