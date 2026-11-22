# API

This section describes the low-level API of the parser and the generator. You will only need it if you implement your
own macros, or if you want to access parts of the result and keep processing them.

The `latex.js` package exports:

- `parse()` and `SyntaxError`: the [parser](#parser)
- `HtmlGenerator`, the [HTML generator](#class-htmlgenerator), and its abstract base class
  [`Generator`](#class-generator)
- `LaTeXJSComponent` and `defineLaTeXJSComponent()`: the [web component](usage.md#webcomponent)
- the TypeScript types `HtmlOptions` (the options of `HtmlGenerator`) and `Hyphenator` (a function that inserts soft
  hyphens into a text)
- `resetSvgIds()`: resets the counter for the ids of the SVG elements that the `picture` environment creates, so that
  translating the same document again gives the same ids (useful in tests)


## Parser

### `parse(latex, options)`

This function parses the given input <latex/> document and returns a generator that creates the output document.

Arguments:

- `latex` <[string]>: the <latex/> source document
- `options` <[Object]>:
  - `generator`: an instance of `HtmlGenerator`
  - `grammarSource` (optional): a name for the source, e.g. its file name; errors report it in `location.source`

Returns the `HtmlGenerator` instance.

### class: SyntaxError

`parse()` throws a `SyntaxError` (a subclass of the built-in `SyntaxError`) if the document cannot be translated: for
actual syntax errors as well as for errors that macros report, like unknown macros or environments, or a missing
argument. Its properties:

- `message` <[string]>: e.g. `unknown macro: \foo`
- `location` <[Object]>: where the error happened: `start` and `end`, each with `line`, `column` (both 1-based) and
  `offset` (0-based), and `source`, the `grammarSource` given to `parse()`
- `expected` and `found`: what the parser expected and what it found instead; `null` if a macro reported the error

`error.format([{ source, text }])` returns a message that shows the line of the error; `source` has to match the
`grammarSource`, `text` is the <latex/> source:

```
Error: unknown macro: \foo
 --> doc.tex:2:25
  |
2 | \begin{itemize}\item a \foo\end{itemize}
  |                         ^^^
```


## class: HtmlGenerator

### CTOR: `new HtmlGenerator(options)`

Create a new HTML generator. `options` is an optional <[Object]> that can have the following properties:

- `documentClass` <[string]>: the document class to use for a document without preamble (default: `"article"`)
- `CustomMacros` <[constructor]>: a class with additional macros, see [Custom Macros](extending.md#custom-macros)
- `hyphenate` <[boolean]|[function]>: `true` (default) hyphenates using the bundled English patterns, `false` disables
  hyphenation. For other languages, pass a function that inserts soft hyphens, e.g. `hyphenateSync` from the
  [hyphen](https://www.npmjs.com/package/hyphen) package: `import { hyphenateSync } from 'hyphen/de'`
- `styles` <[Array]<[string]>>: URLs of additional CSS stylesheets; relative URLs are resolved like the ones of the
  <latex/>.js stylesheets (see [`stylesAndScripts()`](#htmlgenerator-stylesandscripts-baseurl))
- `precision` <[number]>: the number of decimal places of lengths in the output (default: `3`)

### `htmlGenerator.reset()`

Reset the generator. Needs to be called before the generator is used for creating a second document: parsing another
document without a reset fails, e.g. with the error "Two \documentclass commands...".

### `htmlGenerator.htmlDocument(baseURL)`

Returns the full DOM `HTMLDocument` representation of the <latex/> source, including `<head>` and `<body>`. This is meant
to be used as its own standalone webpage or in an `<iframe>`.

`baseURL` will be used as base for the scripts and stylesheets; if omitted, the base will be `window.location.href` or,
if not available, scripts and stylesheets will have relative URLs.

To serialize it, use `htmlGenerator.htmlDocument().documentElement.outerHTML`.

### `htmlGenerator.stylesAndScripts(baseURL)`

Returns a `DocumentFragment` with the `<link>` and `<script>` elements the document needs: the KaTeX stylesheet, the
stylesheets of the document class and the packages, the `styles` from the options, and `js/base.js`. This usually is
part of the `<head>` element.

If `baseURL` is given, the files will be referenced with absolute URLs, otherwise with relative URLs.

### `htmlGenerator.domFragment()`

Returns the DOM `DocumentFragment` of the document: the text body (`<div class="body">`) and the margin notes, if there
are any. This does not include the scripts and stylesheets and is meant for testing and low-level embedding.

### `htmlGenerator.applyLengthsAndGeometryToDom(element)`

Sets the font size and the page geometry (text width and margins) of the document as CSS variables in the style of
`element`. `htmlDocument()` does this for its `<html>` element, and the web component for itself. When you use
`domFragment()`, call it for an element that contains the fragment, e.g. `document.documentElement`.

### `htmlGenerator.documentTitle`

The title of the document as plain text, as set by `\maketitle`, or `"untitled"` if there was no `\maketitle`.
`htmlDocument()` uses it as `<title>`.


## class: Generator

`Generator` is the abstract base class of `HtmlGenerator`. It holds the state of the document (groups, fonts, counters,
lengths, labels, ...), and it is the API that macros use to create output and to change that state: a class with macros
gets the generator in its constructor, see [Custom Macros](extending.md#custom-macros). These are its most important
methods:

**Creating output**

- `create(kind, children, classes)`: an element of the given kind, with the given children (a node or an array of
  nodes) and CSS classes (a string). The kinds are `"inline"` and `"block"` (in HTML: `<span>` and `<div>`), `"par"`,
  `"linebreak"`, the sectioning kinds `"part"` to `"subparagraph"`, kinds for lists, title and abstract, and `"verb"`
  and `"verbatim"`; see `Elements` in `src/generator/elements.ts`.
- `createText(text)`: a text node with the current font attributes, hyphenated
- `createVerbatim(text)`: a text node without font attributes and hyphenation
- `createFragment(...nodes)`: a fragment of the given nodes or arrays of nodes
- `createLink(url, children)`, `createImage(width, height, url)`
- `macro(name, args)`: the output of another macro, e.g. `this.g.macro("LaTeX")`

**Groups and fonts**

- `enterGroup()`, `exitGroup()`: like `{` and `}`; font changes last until the end of the current group
- `setFontFamily(family)`: `"rm"`, `"sf"` or `"tt"`
- `setFontWeight(weight)`: `"md"` or `"bf"`
- `setFontShape(shape)`: `"up"`, `"it"`, `"sl"` or `"sc"`; `"em"` toggles between italic and upright
- `setFontSize(size)`: `"tiny"`, `"scriptsize"`, `"footnotesize"`, `"small"`, `"normalsize"`, `"large"`, `"Large"`,
  `"LARGE"`, `"huge"` or `"Huge"`
- `setAlignment(alignment)`: `"centering"`, `"raggedright"` or `"raggedleft"`

**Counters and lengths**

- `newCounter(name, parent)`: creates a counter that is reset whenever the optional counter `parent` is stepped;
  `\the<name>` shows its value in arabic numerals unless a macro `the<name>` is defined
- `counter(name)`, `setCounter(name, value)`, `stepCounter(name)`
- `arabic(n)`, `roman(n)`, `Roman(n)`, `alph(n)`, `Alph(n)`: a number formatted like `\arabic` etc.
- `newLength(name)`, `length(name)`, `setLength(name, length)`: lengths are `Length` objects, like the parsed arguments of
  type `l`

**References**

- `refCounter(counter, id)`: makes the counter the one that the next `\label` refers to; without `id`, it returns a new
  anchor element to put into the output
- `setLabel(name)`, `ref(name)`: like `\label` and `\ref`

**Errors**

- `error(message)`: reports an error; while parsing, it is thrown as a [`SyntaxError`](#class-syntaxerror) with the
  current position in the source

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor "Class"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
