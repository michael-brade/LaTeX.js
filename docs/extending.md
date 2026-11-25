---
title: Extending LaTeX.js
---

# Extending <latex/>.js

<latex/>.js can be extended with custom macros, and with document classes and packages written in JavaScript. To work
on <latex/>.js itself, see [Development](development.md).

## Architecture

The generated PEG parser parses the <latex/> code. While doing so, it calls appropriate generator functions.
The generator then uses the Macros classes (under `src/latex/`) to execute the macros that the parser encounters.

Both, the parser and the macros create the resulting HTML DOM tree by calling the HtmlGenerator functions.

The generator also holds the stack, the lengths, counters, fonts, references, etc. It provides some of
TeX's primitives and basic functionality, the API, so to speak, that the implementation of the macros uses, see
[Generator](api.md#class-generator).

The macros are methods of classes: `src/latex/latex.ltx.ts` (like `latex.ltx` in <latex/>), the document classes and
the packages. They are loaded in that order, and a later definition of a macro replaces an earlier one. Custom macros
override all of them; only macros that are redefined while the document is translated (e.g. `\thesection` by
`\appendix`) take precedence over custom macros.

## Custom Macros

To define your own <latex/> macros in JavaScript and extend <latex/>.js, you have to create a class that contains these
macros and pass it to the `HtmlGenerator` constructor in the `options` object as `CustomMacros` property. For instance:

```js
class CustomMacros
{
    static args = {}

    constructor(generator) {
        this.g = generator
    }

    static { this.args.bf = ["HV"] }
    bf() {
        this.g.setFontWeight("bf")
    }

    static { this.args.hello = ["H", "g"] }
    hello(name) {
        return ["Hello, ", name, "!"]
    }
}

const generator = new HtmlGenerator({ CustomMacros })
```
or, if the macro arguments should be declared all in one place:
```js
class CustomMacros
{
    static args = {
        bf:     ["HV"],
        hello:  ["H", "g"]
    }
    ...
}
```

to define the <latex/>2.09 macro `\bf`, and a macro `\hello{name}`.

Every method of the class is a macro, except the constructor and methods whose name starts with `_` (helpers). The
constructor gets the generator, which macros use to create output and to change the state of the document, see
[Generator](api.md#class-generator). Custom macros override the macros of <latex/>.js, the documentclass, and all
packages.

A class may also declare `static symbols`, a <[Map]<[string], [string]>> from macro name to a string, each of which
becomes a macro without arguments that produces that string.

A macro of type `H` or `V` (see below) returns an array of nodes and strings; a string becomes text with the current
font attributes. A macro that doesn't create output, e.g. one of type `HV`, returns nothing.

If you are going to define custom macros in an external file and you want to use that with the CLI, you will have to
name the file just like the class, or you will have to default export it. The web component loads its `macros` as an
ES module, so there, the class has to be the default export:

```js
// MyMacros.js
export default class MyMacros
{
    // ...
}
```

### Macro Arguments

`static args` above is an <[Object]> that maps the macro name to the type and arguments of the macro. If a macro doesn't
take arguments and is a horizontal-mode macro, `args` can be left undefined for it. (The macros of <latex/>.js itself
declare the same with the decorators `@Macro` and `@Args`, see `src/macros.ts`.)

The first array entry of `args[<macro name>]` declares the macro type:

| type | meaning |
| ---- | ------- |
| `H`  | horizontal-mode macro |
| `V`  | vertical-mode macro - ends the current paragraph |
| `HV` | horizontal-vertical-mode macro: must return nothing, i.e., doesn't create output |
| `P`  | only in preamble |

The rest of the list (array entries) declares the arguments:

| arg  | delimiters | meaning                       | content | output |
| ---- | --- |--------------------------------------|------|-----|
| `s`  |     | optional star                        |||
|||||
|  `g` | { } | <latex/> code group (possibly long)     | TeX allows `\endgraf`, but not `\par`... so allow `\par` as well | |
| `hg` | { } | restricted horizontal mode material  |||
| `o?` | [ ] | optional arg                         | <latex/> code |  |
|||||
|  `h` |     | restricted horizontal mode material  ||  |
|||||
|  `i` | { } | id                                   | letters only |  |
| `ie` | { } | id or empty                          | letters only, or nothing |  |
| `i?` | [ ] | optional id                          | letters only |  |
|  `k` | { } | key                                  | anything but = and , | |
| `k?` | [ ] | optional key                         | anything but = and , | |
|  `r` | { } | raw text                             | text without parsing it as <latex/>, with balanced nested groups preserved | |
|`csv` | { } | comma-separated values               || |
|`csv?`| [ ] | optional comma-separated values      ||  |
|`kv?` | [ ] | optional key-value list              ||  |
|  `u` | { } | url                                  | a URL as specified by RFC3986 |  |
|  `c` | { } | color specification                  | *name* or *float* or *float,float,float* |  |
|`c-ml`| { } | color model list                     ||  |
|`c-ml?`| [ ] | optional color model list           ||  |
|`c-ssp`| { } | color set specification             ||  |
|`c-spl`| { } | color specification list            ||  |
|  `m` | { } | macro                                | `\macro` | |
|  `l` | { } | length                               ||  |
|`lg?` | { } | optional length group                ||  |
| `l?` | [ ] | optional length                      |||
| `cl` | { } | coordinate/length                    | `<float>` or TeX length |  |
|`cl?` | [ ] | optional coordinate/length           ||  |
|  `n` | { } | num expression                       ||  |
| `n?` | [ ] | optional num expression              ||  |
|  `f` | { } | float expression                     ||  |
|  `v` | ( ) | vector, a pair of coordinates        | (float/length, float/length) |
| `v?` |     | optional vector                      |||
|||||
| `items` |  | the items of a list                  | `\item` ... | |
|`enumitems`| | the items of an enumeration         | `\item` ... | |
|||||
| `is` |     | ignore (following) spaces            |||
|  `X` |     | execute the macro now with the arguments parsed so far |||

So, in the following example, the macro `\title` would be a horizontal-vertical-mode macro that takes one mandatory
TeX-group argument:

```js
args['title'] = ['HV', 'g'];
```

`X` is a special entry and may be used several times: the macro is executed already at that point, with the arguments
that have been parsed so far. This is needed when something has to be done before the next arguments are parsed. The
macro is executed again with all arguments once they are parsed; the return value of the early executions is ignored.
For instance, `\textbf` is declared as `['H', 'X', 'g']`: the first execution opens a group and sets the font, so that
the argument is parsed with it; the second one closes the group again.

Instead of an argument type, an entry can also be an array of alternative argument lists. The parser chooses the list
whose first argument matches the next character in the source: `[` for an optional argument, `{` for a mandatory one.
For instance, `xcolor` declares `\color` as `['HV', [['c-ml?', 'c-spl'], ['c']]]`.

### Environments

An environment `\begin{name}`...`\end{name}` is defined by a macro `name`. It is executed with the arguments of the
environment, and the content of the environment becomes the content of the last element the macro returned. If there
is a macro `endname`, it is executed at `\end{name}`, and its output is added after the environment. An environment
is a group, so font changes in it end with it. Its macro type decides where it can be used: an environment of type
`V` ends the current paragraph and contains paragraphs itself, an environment of type `H` is part of the current
paragraph.

```js
class CustomMacros
{
    static args = {
        boxed: ["V"]
    }

    constructor(generator) {
        this.g = generator
    }

    boxed() {
        return [this.g.create("block", null, "boxed")]
    }
}
```

translates `\begin{boxed}Some text.\end{boxed}` to `<div class="boxed"><p>Some text.</p></div>`.

## Document Classes and Packages

Document classes and packages are classes of macros as well, see `src/latex/documentclasses/` and
`src/latex/packages/`. Their constructor gets the generator, and the options of `\documentclass` or `\usepackage` as
second argument: a <[Map]> from the option name to its value, or `true` for an option without value. A package also
gets the options of the document class.

A document class or package can declare the stylesheet the document needs with `static css`, a URL relative to the
directory with the assets, e.g. `static css = "css/article.css"`. This only works for document classes and packages;
for custom macros, use the `styles` option of `HtmlGenerator`.

When <latex/>.js runs in Node, `\documentclass{name}` and `\usepackage{name}` also look for document classes and
packages that are not built in: they are loaded with `require()` from `dist/documentclasses/name.js` and
`dist/packages/name.js` in the `latex.js` package. Such a module has to export the class, either as default export or
as named export.

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor "Class"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
