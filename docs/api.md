# API

This section is going to describe the low-level API of the generator and the parser. You will only need it if you
implement your own macros, or if you want to access parts of the result and keep processing them.


## Parser

### `parser.parse(latex, { generator: HtmlGenerator })`

This function parses the given input <latex/> document and returns a generator that creates the output document.

Arguments:

- `latex` is the <latex/> source document
- options object: must contain a `generator` property with an instance of `HtmlGenerator`

Returns the `HtmlGenerator` instance.

### `SyntaxError`


## AST

TODO

## class: Generator

TODO


## class: HtmlGenerator

### CTOR: `new HtmlGenerator(options)`

Create a new HTML generator. `options` is an <[Object]> that can have the following properties:

- `documentClass`: <[string]> the default document class if a document without preamble is parsed
- `CustomMacros`: a <[constructor]>/<[function]> with additional custom macros
- `hyphenate`: <[boolean]> enable or disable automatic hyphenation
- `languagePatterns`: language patterns object to use for hyphenation if it is enabled
- `styles`: <[Array]<[string]>> additional CSS stylesheets

### `htmlGenerator.reset()`

Reset the generator. Needs to be called before the generator is used for creating a second document.

### `htmlGenerator.htmlDocument(baseURL)`

Returns the full DOM `HTMLDocument` representation of the <latex/> source, including `<head>` and `<body`>. This is meant
to be used as its own standalone webpage or in an `<iframe>`.

`baseURL` will be used as base for the scripts and stylesheets; if omitted, the base will be `window.location.href` or,
if not available, scripts and stylesheets will have relative URLs.

To serialize it, use `htmlGenerator.htmlDocument().outerHTML`.

### `htmlGenerator.stylesAndScripts(baseURL)`

Returns a `DocumentFragment` with `<link>` and `<script>` elements. This usually is part of the `<head>` element.

If `baseURL` is given, the files will be referenced with absolute URLs, otherwise with relative URLs.

### `htmlGenerator.domFragment()`

Returns the DOM `DocumentFragment`. This does not include the scripts and stylesheets and is meant for testing and
low-level embedding.

### `htmlGenerator.documentTitle()`

The title of the document.

[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor "Class"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
