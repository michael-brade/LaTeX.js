<template>
    <div id="playground">
        <codemirror id="latex-editor" :value="code" :options="cmOptions" @input="onCmCodeChange" @ready="onCmReady" />

        <div id="gutter" ref="gutter"></div>

        <iframe id="preview" ref="preview" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
</template>


<script>
// webpack doesn't handle import.meta.url yet, so don't use latex.mjs
import { parse, HtmlGenerator, SyntaxError } from '../../../dist/latex.js'
import en from 'hyphenation.en-us'

import Split from 'split-grid'
import showcase from 'raw-loader!../../showcase.tex'

// codemirror base style
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'


const generator = new HtmlGenerator({
    hyphenate: true,
    languagePatterns: en,
    styles: ['css/error.css']
})

var scrollY = 0

function links() {
    var as = document.getElementsByTagName("a")
    for (var i = 0; i < as.length; i++) {
        if (as[i].getAttribute("href").startsWith("#")) {
            as[i].addEventListener("click", function(ev) {
                ev.preventDefault()
                var target = ev.target.getAttribute("href").substr(1)
                var te = document.getElementById(target)

                document.scrollingElement.scrollTop = offsetTop(te)
            })
        }
    }
}

/* function to compile latex source into the given iframe */
function compile(latex, iframe) {
    var doc = iframe.contentDocument

    if (doc.readyState !== "complete")
        return

    try {
        generator.reset()
        var newDoc = parse(latex, { generator: generator }).htmlDocument()

        // we need to disable normal processing of same-page links in the iframe
        // see also https://stackoverflow.com/questions/50657574/iframe-with-srcdoc-same-page-links-load-the-parent-page-in-the-frame
        var linkScript = newDoc.createElement('script')
        linkScript.text = 'document.addEventListener("DOMContentLoaded", ' + links.toString() + ')'
        newDoc.head.appendChild(linkScript)

        // don't reload all the styles and fonts if not needed!
        if (doc.head.innerHTML == newDoc.head.innerHTML) {
            var newBody = doc.adoptNode(newDoc.body)
            doc.documentElement.replaceChild(newBody, doc.body)
            doc.documentElement.style.cssText = newDoc.documentElement.style.cssText
        } else {
            iframe.srcdoc = newDoc.documentElement.outerHTML

            // var blob = new Blob([newDoc.documentElement.innerHTML], {type : 'text/html'});
            // iframe.src = URL.createObjectURL(blob);
        }

        if (scrollY) {
            iframe.contentWindow.scrollTo(0, scrollY)
            scrollY = 0
        }
    } catch (e) {
        console.error(e)

        // save scrolling position and restore on next successful compile
        if (!scrollY)
            scrollY = iframe.contentWindow.pageYOffset

        if (e instanceof SyntaxError) {
            var error = {
                line:     definedOrElse(e.location.start.line, 0),
                column:   definedOrElse(e.location.start.column, 0),
                message:  e.message,
                found:    definedOrElse(e.found, ""),
                expected: definedOrElse(e.expected, ""),
                location: excerpt(latex, definedOrElse(e.location.start.offset, 0))
            };

            doc.body.innerHTML = '<pre class="error">ERROR: Parsing failure:\n\n' + errorMessage(error, true) + '</pre>'
        } else {
            doc.body.innerHTML = '<pre class="error">ERROR: ' + e.message + '</pre>'
        }
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




// LtxPlayground component
export default {
    data() {
        return {
            code: showcase,
            cmOptions: {
                tabSize: 4,
                mode: 'text/x-latex',
                theme: 'monokai',
                styleActiveLine: true,
                matchBrackets: true,
                showCursorWhenSelecting: true,

                // TODO
                autofocus: true,
                lineWrapping: true,
                lineNumbers: true,
                indentUnit: 4
            }
        }
    },
    components: {
        codemirror: () => import('vue-codemirror').then(module => module.codemirror)
    },
    methods: {
        onCmReady(cm) {
            compile(this.code, this.$refs.preview)
        },
        onCmCodeChange(newCode) {
            this.code = newCode
            compile(newCode, this.$refs.preview)
        }
    },

    beforeMount() {
        // import language
        import('codemirror/mode/stex/stex.js')

        // addons
        import('codemirror/addon/selection/active-line.js')
        import('codemirror/addon/edit/matchbrackets.js')
    },

    mounted() {
        Split({
            columnGutters: [{
                track: 1,
                element: this.$refs.gutter
            }]
        });
    }
}
</script>



<style scoped lang="stylus">
#playground {
    margin: 0;
    height: 100%;

    display: grid;
    grid-template-rows: 100%;
    grid-template-columns: 1fr 6px 1fr;
    grid-template-areas: "latex gutter preview";
}

#footer {
    display: flex;
    align-items: center;
    justify-content: center;

    color: hsla(0, 0%, 100%, .65);
    background: #2d9961;
    font-size: 1.5vh;
}

#footer {
    grid-area: footer;
}

#latex-editor {
    grid-area: latex;
    height: 100%;

    >>> .CodeMirror {
        height: 100%;
    }
}


#preview {
    grid-area: preview;
    color: #333;
    border: none;
    width: 100%;
    height: 100%;
}

/* splitter */

#gutter {
    /* background-color: #eee; */
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: col-resize;

    &:before {
        display: block;
        content: "";
        width: 2px;
        height: 40px;
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
    }

    &:hover:before {
        border-color: #999;
    }
}
</style>
