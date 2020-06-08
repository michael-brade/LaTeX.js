# Usage

<latex/>.js has a command line interface (CLI), it can be embedded in a website using the provided webcomponent, or it
can be used to directly obtain and possibly modify the generated HTML/DOM by accessing the low-level classes. Each of those use-cases is explained in the following subsections.


<latex/>.js can parse full <latex/> documents as well as documents without a preamble and only the text that comes
between `\begin{document}` and `\end{document}` in a full <latex/> document. In that latter case, the default
documentclass is used, which is `article` unless specified otherwise.


## CLI

For CLI usage, you will probably want to install <latex/>.js globally:

```
npm install -g latex.js
```

The CLI has the following options:

```
Usage: latex.js [options] [files...]

JavaScript LaTeX to HTML5 translator

Options:

  -V, --version          output the version number
  -o, --output <file>    specify output file, otherwise STDOUT will be used
  -a, --assets [dir]     copy CSS and fonts to the directory of the output file, unless dir is given (default: no assets are copied)
  -u, --url <base URL>   set the base URL to use for the assets (default: use relative URLs)
  -b, --body             don't include HTML boilerplate and CSS, only output the contents of body
  -e, --entities         encode HTML entities in the output instead of using UTF-8 characters
  -p, --pretty           beautify the html (this may add/remove spaces unintentionally)
  -c, --class <class>    set a default documentclass for documents without a preamble (default: article)
  -m, --macros <file>    load a JavaScript file with additional custom macros
  -s, --stylesheet <url> specify an additional style sheet to use (can be repeated)
  -n, --no-hyphenation   don't insert soft hyphens (disables automatic hyphenation in the browser)
  -l, --language <lang>  set hyphenation language (default: en)
  -h, --help             output usage information

If no input files are given, STDIN is read.
```

## WebComponent

<latex/>.js can be used as a web component:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta http-equiv="content-language" content="en">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <script type="module">
    import { LaTeXJSComponent } from "https://cdn.jsdelivr.net/npm/latex.js/dist/latex.mjs"
    customElements.define("latex-js", LaTeXJSComponent)
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

The `<latex-js>` element supports a few attributes to configure <latex/>.js:

- `baseURL`: if you want the <latex/>.js component to use a different set of stylesheets than the ones delivered along
  with the `latex.component.js`, then you need to set the base using this attribute.

- `hyphenate`: enable or disable hyphenation (default: enabled)


## Library

For library usage add it to your project:

```
npm install --save-prod latex.js
```

This is the low-level use-case which gives the greatest control over the translation process.

 <latex/>.js is divided into a parser and a generator, so that in theory you could switch the generator to create e.g.
plain text instead of HTML. Currently, only a HTML generator exists.

Import the parser and generator, then parse and translate to HTML:

<<< @/test/api/node.mjs#code

Or using the CommonJS module syntax:

<<< @/test/api/node.js#code

The `HtmlGenerator` takes several options, see the API section below.


## In the Browser

If you want to use the parser and the generator manually, you can either use your own build or use a link directly to
the jsDelivr CDN:

<<< @/test/api/browser.html

Note that in this case the styles and scripts are not encapsulated, so they can clash with the text and style of the
containing page.
