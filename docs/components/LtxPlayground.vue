<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

import Split from 'split-grid'

// CodeMirror
import CodeMirror from 'vue-codemirror6'

import { EditorState, type Extension } from '@codemirror/state'
import {
    EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection,
    dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine
} from '@codemirror/view'
import { foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { closeBracketsKeymap } from '@codemirror/autocomplete'
import { lintGutter, lintKeymap, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import { latex } from 'codemirror-lang-latex';
import { oneDark } from '@codemirror/theme-one-dark'

// LaTeX.js
import { SyntaxError as LaTeXSyntaxError } from 'latex.js'
import { compile, compileDebounced, applyZoom, handleLinks } from './LaTeX.ts'
import showcase from '../showcase.tex?raw'


// editor font size (CodeMirror inherits VitePress' 16px otherwise)
const fontSize = EditorView.theme({
    '&': { fontSize: '13px' }
})

// editorSetup currently does what `basicSetup` from the `codemirror` package does;
// latex() already brings autocompletion (+ completionKeymap), closeBrackets and bracket matching,
// plus linting and hover tooltips, so no need for them here
const editorSetup: Extension[] = [
    // gutters
    lineNumbers(),
    highlightActiveLineGutter(),
    lintGutter(),
    foldGutter(),

    // display
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),   // used if the theme has no highlighting
    EditorView.lineWrapping,

    // editing
    history(),
    indentOnInput(),
    EditorState.allowMultipleSelections.of(true),
    rectangularSelection(),
    crosshairCursor(),

    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...lintKeymap
    ])
]

const extensions: Extension[] = [
    editorSetup,
    latex({
        autoCloseTags: true,
        autoCloseBrackets: true,
        enableAutocomplete: true,
        enableLinting: false,       // we get the real parse errors (showErrors()); a linter would replace them
        enableTooltips: true
    }),
    oneDark,
    fontSize
]

// not a ref: Vue's proxy would get in the way of CodeMirror
let view: EditorView | null = null


// absolute URL of the LaTeX.js css/, fonts/ and js/ folders (docs/public/latexjs/), respecting the site's base;
// a function because window doesn't exist during SSR
const latexjsURL = () => window.location.origin + withBase('/latexjs/')

const code = ref<string>(showcase)
const preview = ref<HTMLIFrameElement | null>(null)
const gutter = ref<HTMLDivElement | null>(null)


/** Show a LaTeX.js error (or none) in the editor, at its position in the source. */
const showErrors = (error: unknown) => {
    if (!view) return

    const diagnostics: Diagnostic[] = []

    // other errors have no position; they are only shown in the preview
    if (error instanceof LaTeXSyntaxError) {
        const length = view.state.doc.length
        const from = Math.min(error.location.start.offset, length)
        const to = Math.min(Math.max(error.location.end.offset, from + 1), length)
        diagnostics.push({ from, to, severity: 'error', source: 'LaTeX.js', message: error.message })
    }

    view.dispatch(setDiagnostics(view.state, diagnostics))
}

const compileNow = () => {
    if (view && preview.value)
        showErrors(compile(view.state.doc.toString(), preview.value, latexjsURL()))
}

const onCmReady = async ({ view: v }: { view: EditorView }) => {
    view = v
    compileNow()
}

const onCmCodeChange = (state: EditorState) => {
    if (preview.value)
        compileDebounced(state.doc.toString(), preview.value, latexjsURL(), showErrors)
}


// zoom of the output: Ctrl+wheel (also trackpad pinch) over the preview, or the buttons

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

const zoomRef = ref(1)

const zoomTo = (z: number) => {
    zoomRef.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100))
    if (preview.value)
        applyZoom(preview.value, zoomRef.value)
}

// step to the next multiple of 10%
const zoomIn = () => zoomTo(Math.floor(zoomRef.value * 10 + 1e-6) / 10 + 0.1)
const zoomOut = () => zoomTo(Math.ceil(zoomRef.value * 10 - 1e-6) / 10 - 0.1)

// one 10% step per wheel notch; browsers report very different deltas for a notch (Firefox ~ 170px,
// Chromium ~ 70px), so ignore its size. Trackpad pinch sends many small deltas instead: sum them up
// until they are worth a notch.
const WHEEL_STEP = 40   // px
let wheelSum = 0

const onWheel = (e: WheelEvent) => {
    // zoom with Ctrl or Meta/Cmd
    if (!e.ctrlKey && !e.metaKey) return

    // don't zoom the whole page
    e.preventDefault()

    const multiplier =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 33 :
        e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 400 :
        1

    const dy = e.deltaY * multiplier

    // ignore 0-delta events so they don't accidentally reset wheelSum (Math.sign(0) === 0)
    if (dy === 0) return

    if (Math.sign(dy) !== Math.sign(wheelSum))
        wheelSum = 0            // changed direction -> reset

    wheelSum += dy

    if (Math.abs(wheelSum) >= WHEEL_STEP) {
        wheelSum < 0 ? zoomIn() : zoomOut()
        wheelSum = 0 // Discard remainder so 1 notch = 1 step
    }
}

// events inside the iframe don't reach this page: listen in each document the iframe loads
const onPreviewLoad = () => {
    const doc = preview.value?.contentDocument
    if (!doc) return

    // the initial about:blank finished loading (no srcdoc yet): onCmReady may have come too early,
    // when compile() still had to skip it, so do the first render now
    if (!preview.value!.srcdoc)
        compileNow()

    handleLinks(doc)

    // passive:false because onWheel actually calls preventDefault()
    doc.addEventListener('wheel', onWheel, { passive: false })

    applyZoom(preview.value!, zoomRef.value)
}


onMounted(() => {
    if (gutter.value) {
        Split({
            columnGutters: [{
                track: 1,
                element: gutter.value
            }],
            onDragEnd: () => {
                // microscopic opacity shift forces Chrome to reset the scroll tree
                // without this, scrolling with the mousewheel is not possible after using the splitter
                if (preview.value) {
                    preview.value.style.opacity = '0.999';
                    requestAnimationFrame(() => preview.value!.style.opacity = '1');
                }
            }
        })
    }
})
</script>


<template>
    <div id="playground">
        <!-- Left side: editor -->
        <div class="pane-wrapper">
            <div class="absolute-container">
                <code-mirror id="latex-editor"
                    v-model="code"
                    :extensions="extensions"
                    :autofocus="true"
                    :indent-with-tab="true"
                    :tab-size="4"
                    @ready="onCmReady"
                    @change="onCmCodeChange"
                />
            </div>
        </div>

        <!-- Gutter / splitter -->
        <div id="gutter" ref="gutter"></div>

        <!-- Right side: LaTeX preview -->
        <div class="pane-wrapper" @wheel="onWheel">
            <iframe id="preview" ref="preview"
                sandbox="allow-same-origin allow-scripts"
                @load="onPreviewLoad"
            ></iframe>

            <div class="zoom-controls">
                <button title="Zoom out (Ctrl+wheel)" :disabled="zoomRef <= MIN_ZOOM" @click="zoomOut">−</button>
                <button title="Reset zoom" @click="zoomTo(1)">{{ Math.round(zoomRef * 100) }}%</button>
                <button title="Zoom in (Ctrl+wheel)" :disabled="zoomRef >= MAX_ZOOM" @click="zoomIn">+</button>
            </div>
        </div>
    </div>
</template>


<style scoped lang="scss">
$border: #ccc;

#playground {
    margin: 0;
    height: 100%;
    display: grid;
    grid-template-rows: 100%;
    grid-template-columns: 1fr 6px 1fr;
}

.pane-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.absolute-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    /*
    Target CodeMirror's core web component layout directly.
    This treats whatever element the wrapper generates as a strict layout block.
    */
    > div,
    :deep(.cm-editor) {
        height: 100% !important;
        width: 100% !important;
    }

    /* Ensure inner scroll tracks do not bubble up layout shifts to split-grid */
    :deep(.cm-scroller) {
        overflow: auto;
        scrollbar-gutter: stable; /* Keeps layout tracking static when scrollbars toggle */
    }
}

#latex-editor {
    width: 100%;
    height: 100%;
}

#gutter {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: col-resize;

    &::before {
        display: block;
        content: '';
        width: 2px;
        height: 40px;
        border-left: 1px solid $border;
        border-right: 1px solid $border;
    }

    &:hover::before {
        border-color: #999;
    }
}

#preview {
    color: #333;
    background: #fff;   /* LaTeX output is black on white, also in VitePress' dark mode */
    border: none;
    width: 100%;
    height: 100%;
}

/* zoom buttons, floating at the top right of the output */
.zoom-controls {
    position: absolute;
    top: 8px;
    right: 24px;    /* leave room for the iframe's scrollbar */
    display: flex;
    border: 1px solid $border;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    color: #333;
    opacity: 0.5;
    transition: opacity 0.2s;
    overflow: hidden;

    &:hover {
        opacity: 1;
    }

    button {
        padding: 2px 8px;
        min-width: 28px;
        font-variant-numeric: tabular-nums;

        & + button {
            border-left: 1px solid $border;
        }

        &:hover:not(:disabled) {
            background: #eee;
        }

        &:disabled {
            color: #bbb;
            cursor: default;
        }
    }
}
</style>
