var HtmlGenerator = require('html-generator').HtmlGenerator
var en = require('hyphenation.en-us')

var latexjs = require('latex-parser')


var generator = new HtmlGenerator({
    hyphenate: true,
    languagePatterns: en
})


/* function to compile latex source into the HTML element preview */
module.exports.compile = function(latex, preview) {
    try {
        generator.reset()
        var result = latexjs.parse(latex, { generator: generator })

        while (preview.firstChild)
            preview.removeChild(preview.firstChild)

        preview.appendChild(result.dom())
    } catch (e) {
        var error
        if (e instanceof latexjs.SyntaxError) {
            error = {
                line:     definedOrElse(e.location.start.line, 0),
                column:   definedOrElse(e.location.start.column, 0),
                message:  e.message,
                found:    definedOrElse(e.found, ""),
                expected: definedOrElse(e.expected, ""),
                location: excerpt(latex, definedOrElse(e.location.start.offset, 0))
            };

            preview.innerHTML = "<pre>ERROR: Parsing failure:\n\n" + errorMessage(error, true) + "</pre>"
        } else {
            preview.innerHTML = "<pre>ERROR: " + e.message + "</pre>";
        }
        console.error(e)
    }
}


function definedOrElse(value, fallback) {
    return (typeof value !== "undefined" ? value : fallback);
};


/* utility function: create a source excerpt */
function excerpt(txt, o) {
    var l = txt.length;
    var b = o - 20; if (b < 0) b = 0;
    var e = o + 20; if (e > l) e = l;
    var hex = function (ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
    };
    var extract = function (txt, pos, len) {
        return txt.substr(pos, len)
        .replace(/\\/g,   "\\\\")
        .replace(/\x08/g, "\\b")
        .replace(/\t/g,   "\\t")
        .replace(/\n/g,   "\\n")
        .replace(/\f/g,   "\\f")
        .replace(/\r/g,   "\\r")
        .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return "\\x0" + hex(ch); })
        .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return "\\x"  + hex(ch); })
        .replace(/[\u0100-\u0FFF]/g,         function(ch) { return "\\u0" + hex(ch); })
        .replace(/[\u1000-\uFFFF]/g,         function(ch) { return "\\u"  + hex(ch); });
    };
    return {
        prolog: extract(txt, b, o - b),
        token:  extract(txt, o, 1),
        epilog: extract(txt, o + 1, e - (o + 1))
    };
}


/* render a useful error message */
function errorMessage(e, noFinalNewline) {
    var l = e.location;
    var prefix1 = "line " + e.line + " (column " + e.column + "): ";
    var prefix2 = "";
    for (var i = 0; i < prefix1.length + l.prolog.length; i++)
        prefix2 += "-";
    var msg = prefix1 + l.prolog + l.token + l.epilog + "\n" +
        prefix2 + "^" + "\n" +
        e.message + (noFinalNewline ? "" : "\n");

    return msg;
};