# Usage

<latex/>.js has a command line interface (CLI), it can be embedded in a website using the provided web component, or
it can be used to directly obtain and possibly modify the generated HTML/DOM by accessing the low-level classes. Each
of those use-cases is explained in the following subsections.


<latex/>.js can parse full <latex/> documents as well as documents without a preamble and only the text that comes
between `\begin{document}` and `\end{document}` in a full <latex/> document. In that latter case, the default
documentclass is used, which is `article` unless specified otherwise.


## CLI

For CLI usage, you will probably want to install <latex/>.js globally (it needs Node.js 22 or newer):

```
npm install -g latex.js
```

The CLI has the following options:

```
Usage: latex.js [options] [files...]

JavaScript LaTeX to HTML5 translator

Options:
  -V, --version           output the version number
  -o, --output <file>     specify output file, otherwise STDOUT will be used
  -a, --assets [dir]      copy CSS and fonts to the directory of the output
                          file, unless dir is given (default: no assets are
                          copied)
  -u, --url <base URL>    set the base URL to use for the assets (default: use
                          relative URLs)
  -b, --body              don't include HTML boilerplate and CSS, only output
                          the contents of body
  -e, --entities          encode HTML entities in the output instead of using
                          UTF-8 characters
  -p, --pretty            beautify the html (this may add/remove spaces
                          unintentionally)
  -c, --class <class>     set a default documentclass for documents without a
                          preamble (default: "article")
  -m, --macros <file>     load a JavaScript file with additional custom macros
  -s, --stylesheet <url>  specify an additional style sheet to use (can be
                          repeated)
  -n, --no-hyphenation    don't insert soft hyphens (disables automatic
                          hyphenation in the browser)
  -l, --language <lang>   set hyphenation language, any language supported by
                          the "hyphen" package (en-us, en-gb, de, fr, ...)
                          (default: "en")
  -h, --help              display help for the latex.js command

If no input files are given, STDIN is read.
```

Several input files are joined, separated by an empty line, and translated as one document.

Unless `-b` is given, the output is a complete HTML document that references its stylesheets, fonts and scripts
(the folders `css/`, `fonts/` and `js/`) relative to the HTML file, or relative to the base URL given with `-u`. `-a`
copies these three folders next to the output file, or into the given directory. Since that directory is optional,
put `-a` after the input files: in `latex.js -a doc.tex`, `doc.tex` would be taken as the directory. For instance,
this translates `doc.tex` to `html/doc.html` and copies the assets to `html/`:

```sh
latex.js doc.tex -o html/doc.html -a
```

The file given with `-m` is loaded with Node's `require()`, so it can be a CommonJS or an ES module. It has to export
the class with the [custom macros](extending.md#custom-macros) either as default export or as a named export with the
same name as the file, e.g. `class MyMacros` in `MyMacros.js`.


## WebComponent

<latex/>.js can be used as a web component:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="content-language" content="en">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <script type="module">
    import { defineLaTeXJSComponent } from "https://cdn.jsdelivr.net/npm/latex.js/dist/latex.js"
    defineLaTeXJSComponent()   // or: customElements.define("latex-js", LaTeXJSComponent)
  </script>

  <style>
    latex-js {
      display: inline-block;
      width: 40%;
      border: 1px solid red;
      margin-right: 2em;
    }
  </style>

  <title>LaTeX.js Web Component Test</title>
</head>

<body>
  <h1>Compiling LaTeX</h1>

  <latex-js baseURL="https://cdn.jsdelivr.net/npm/latex.js/dist/">
    \documentclass{article}

    \begin{document}
    Hello World.
    \end{document}
  </latex-js>


  <latex-js hyphenate="false">
    Another.
  </latex-js>

</body>

</html>
```

This, however, requires a browser with support for the shadow DOM.

Then you need to decide how to embed the `<latex-js>` element and style it accordingly with CSS; most importantly, set
the `display:` property. It is `inline` by default.

`defineLaTeXJSComponent(name = "latex-js")` registers the element; it does nothing if the element is already defined
(e.g. with hot module reloading) or outside of the browser, so it is safe to call in code that is also run on the
server. Without modules, load the UMD build `dist/latex.umd.cjs` with a `<script>` tag instead; it provides everything
as properties of the global `latexjs`, e.g. `latexjs.defineLaTeXJSComponent()`.

The `<latex-js>` element renders again whenever its content or one of its attributes changes, so frameworks like React
or Vue can simply set its content. If the new content doesn't parse, the error is logged to the console and the
previous rendering stays.

The output is rendered into the element's shadow DOM, so it is isolated from the styles of the page. Fonts are the
exception, since `@font-face` rules are ignored in a shadow DOM: the element adds the stylesheets `fonts/cmu.css` and
`fonts/katex.css` to the `<head>` of the page, once.

The `<latex-js>` element supports a few attributes to configure <latex/>.js:

- `baseURL`: where to load the stylesheets, fonts and scripts (`css/`, `fonts/`, `js/` in `dist/`) from; it may be
  relative to the page. By default, they are loaded from next to the `latex.js` module, or, with the UMD build,
  relative to the page. If you use a bundler (Vite, webpack, ...), latex.js is bundled into your code, so you have to
  serve these files yourself (e.g. copy them from `node_modules/latex.js/dist/` to your public folder) or use a CDN,
  and set `baseURL` accordingly.

- `hyphenate`: `"false"` disables hyphenation; it is enabled by default, using the English patterns

- `macros`: URL of an ES module that has the class with the [custom macros](extending.md#custom-macros) as default
  export; a relative URL is resolved against `baseURL` (or its default), not against the page

- `stylesheet`: URL of an additional stylesheet, may be relative to the page


## Library

For library usage add it to your project:

```
npm install --save-prod latex.js
```

This is the low-level use-case which gives the greatest control over the translation process.

<latex/>.js is divided into a parser and a generator, so that in theory you could switch the generator to create e.g.
plain text instead of HTML. Currently, only an HTML generator exists.

Outside of the browser, <latex/>.js needs a DOM implementation, e.g. [svgdom](https://www.npmjs.com/package/svgdom),
which the CLI uses. Its `window` and `document` have to be globals, and they have to be set before latex.js is loaded:
the [svg.js](https://svgjs.dev/) bundled into latex.js, which draws the `picture` environment, takes them from the
globals when it is loaded.

Set up the DOM, import the parser and the generator, then parse and translate to HTML:

<<< ../test/api/node.mjs#code

Or using the CommonJS module syntax:

<<< ../test/api/node.cjs#code

The `HtmlGenerator` takes several options, see [API](api.md#class-htmlgenerator). A generator translates one
document; to translate another one, call `generator.reset()` first, or create a new generator.

The package includes TypeScript types.


## In the Browser

If you want to use the parser and the generator manually, you can either use your own build or use a link directly to
the jsDelivr CDN:

<<< ../test/api/browser.html

`stylesAndScripts()` creates the `<link>` and `<script>` elements the document needs, `domFragment()` is the document
itself, and `applyLengthsAndGeometryToDom()` sets the font size, text width and margins of the document class as CSS
variables.

Note that in this case the styles and scripts are not encapsulated, so they can clash with the text and style of the
containing page.


## Document Classes and Packages

The document classes `article`, `book` and `report` are built in, and so are these packages, several of them only in
part: `color`, `xcolor`, `graphics`, `graphicx`, `hyperref`, `multicol`, `latexsym`, `gensymb`, `textcomp`,
`textgreek` and `stix`. `\usepackage` also accepts `calc`, `picture`, `pict2e`, `pspicture`, `keyval` and `comment`:
the parts of them that <latex/>.js supports are built into its core.

A document class or package that <latex/>.js doesn't know is reported on the console and not loaded, so the macros it
would define are unknown. <latex/>.js cannot load the original <latex/> package source, each package has to be (re)written
in JavaScript, see [Extending](extending.md#document-classes-and-packages).

Math is typeset by [KaTeX](https://katex.org/).
