<script>
    import { codemirror } from 'vue-codemirror'
    // import Codemirror from 'codemirror'

    // import language
    import 'codemirror/mode/stex/stex.js'

    // import base style
    import 'codemirror/lib/codemirror.css'
    import 'codemirror/theme/monokai.css'

    // addons
    import 'codemirror/addon/selection/active-line.js'
    import 'codemirror/addon/edit/matchbrackets.js'

    import Split from 'split-grid'
    import showcase from 'raw-loader!../../showcase.tex'

    import '../public/js/playground.bundle'

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
            codemirror
        },
        methods: {
            onCmReady(cm) {
                console.log('the editor is readied!', cm)
            },
            onCmFocus(cm) {
                console.log('the editor is focused!', cm)
            },
            onCmCodeChange(newCode) {
                console.log('new code')
                this.code = newCode
                Playground.compile(newCode, iframe)
                iframe.contentDocument.dispatchEvent(new Event('change'))
            }
        },
        mounted: function() {
            Split({
                columnGutters: [{
                    track: 1,
                    element: document.querySelector('#gutter')
                }]
            });

            var iframe = document.getElementById('preview')
            Playground.compile(this.code, iframe)
            // editor.refresh()
        }
    }
</script>


<template>
    <div id="playground">
        <div id="header">
            <span><LaTeX.js /> Live Playground</span>
        </div>

        <codemirror id="latex-editor" :value="code" :options="cmOptions" @input="onCmCodeChange" />

        <div id="gutter"></div>

        <iframe id="preview" sandbox="allow-same-origin allow-scripts"></iframe>

        <div id="footer">
            <div id="copyright">Copyright &copy; 2017-2020 Michael Brade</div>
        </div>
    </div>
</template>


<style scoped>
#playground {
    margin: 0;
    height: 100vh;

    display: grid;
    grid-template-rows: 5% 92% 3%;
    grid-template-columns: 1fr 6px 1fr;
    grid-template-areas:
        "header header header"
        "latex gutter preview"
        "footer footer footer";
}

#header, #footer {
    display: flex;
    align-items: center;
    justify-content: center;

    color: hsla(0, 0%, 100%, .65);
    background: #2d9961;
    font-size: 1.5vh;
}

#header {
    grid-area: header;
    font-size: 3vh;
    font-family: sans-serif;
}

#footer {
    grid-area: footer;
}

#latex-editor {
    grid-area: latex;
    height: 100%;
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
}

#gutter:before {
    display: block;
    content: "";
    width: 2px;
    height: 40px;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
}

#gutter:hover:before {
    border-color: #999;
}
</style>
