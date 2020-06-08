---
title: Extending LaTeX.js
---

# Extending <latex/>.js

To work on <latex/>.js itself and to extend it, first clone this repository.

## Architecture

The generated PEG parser parses the <latex/> code. While doing so, it calls appropriate generator functions.
The generator then uses the Macros class to execute the macros that the parser encounters.

Both, the parser and the macros create the resulting HTML DOM tree by calling the HtmlGenerator functions.

The generator also holds the stack, the lengths, counters, fonts, references, etc. It provides some of
TeX's primitives and basic functionality, so to speak.

## Directory Structure

General structure:

- `src`: all the <latex/>.js sources
- `bin`: the compiled CLI
- `dist`: the compiled and minified source
- `docs`: the webpage and playground
- `webpage`: the compiled webpage and playground
- `test`: unit tests and test driver

Files and classes needed to translate <latex/> documents to HTML documents:

- the parser: `src/latex-parser.pegjs`
- the generator: `src/generator.ls` and `src/html-generator.ls`
- macros and documentclasses: `src/latex.ltx.ls`, `src/symbols.ls`, `src/documentclasses/*.ls`
- packages: `src/packages/*.ls`

- the CLI: `src/latex.js.ls`
- the webcomponent: `src/latex.component.mjs`
- the library API: `src/index.mjs`

Files needed to display the generated HTML document:

- `src/js/` (and thus `dist/js/`): JavaScript that is needed by the resulting HTML document
- `src/css/` (and thus `dist/js/`): CSS needed by translated HTML document
- `src/fonts/` (and thus `dist/fonts`): fonts included by the translated HTML document

## Tests

To build it and run the tests, clone this repository and execute:

```sh
npm install
npm run build   # or devbuild
npm test
```

To verify the screenshots (the CSS tests), `ImageMagick` needs to be installed. Screenshots are taken
with Chromium using `puppeteer`.

## Documentation and Playground

To build the website, including the playground, execute:

```sh
npm run docs
```

## Definition of Custom Macros

To define your own <latex/> macros in JavaScript and extend <latex/>.js, you have to create a class that contains these macros
and pass it to the `HtmlGenerator` constructor in the `options` object as `CustomMacros` property. For instance:

```js
var generator = new latexjs.HtmlGenerator({
  CustomMacros: (function() {
    var args      = CustomMacros.args = {},
        prototype = CustomMacros.prototype;

    function CustomMacros(generator) {
      this.g = generator;
    }

    args['bf'] = ['HV']
    prototype['bf'] = function() {
      this.g.setFontWeight('bf')
    };

    return CustomMacros;
  }())
});
```

to define the <latex/>2.09 macro `\bf`.

If you are going to define custom macros in an external file and you want to use that with the CLI, you will have to
name the file just like the class, or you will have to default export it.

### Macro Arguments

`CustomMacros.args` above is a <[Map]<[string], [Array]<[string]>>>, mapping the macro name to the type and arguments of
the macro. If a macro doesn't take arguments and is a horizontal-mode macro, `args` can be left undefined for it.

The first array entry of `args[<macro name>]` declares the macro type:

| type | meaning |
| ---- | ------- |
| `H`  | horizontal-mode macro |
| `V`  | vertical-mode macro - ends the current paragraph |
| `HV` | horizontal-vertical-mode macro: must return nothing, i.e., doesn't create output |
| `P`  | only in preamble |
| `X`  | special entry, may be used multiple times; execute action (macro body) already now with whatever arguments have been parsed so far; this is needed when things should be done before the next arguments are parsed - no value should be returned by the macro in this case, for it will just be ignored |

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
| `i?` | [ ] | optional id                          | letters only |  |
|  `k` | { } | key                                  | anything but = and , | |
| `k?` | [ ] | optional key                         | anything but = and , | |
|`csv` | { } | comma-separated values               || |
|`csv?`| [ ] | optional comma-separated values      ||  |
|`kv?` | [ ] | optional key-value list              ||  |
|  `u` | { } | url                                  | a URL as specified by RFC3986 |  |
|  `c` | { } | color specification                  | *name* or *float* or *float,float,float* |  |
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
| `is` |     | ignore (following) spaces            |||

So, in the following example, the macro `\title` would be a horizontal-vertical-mode macro that takes one mandatory
TeX-group argument:

```js
args['title'] = ['HV', 'g'];
```

Macros with types `H` or `V` have to return an array.

Environments take the return value of the corresponding macro and add their content as child/children to it.

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor "Class"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
