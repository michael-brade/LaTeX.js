<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Split from 'split-grid'

// CodeMirror
import CodeMirror from 'vue-codemirror6'
import { basicSetup } from 'codemirror'

import type { LanguageSupport } from '@codemirror/language';
import type { EditorState, Extension } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { latex } from 'codemirror-lang-latex';
import { oneDark } from '@codemirror/theme-one-dark'

// LaTeX.js
import { compile, zoom } from './LaTeX.ts'
import showcase from '../showcase.tex?raw'


// editor font size (CodeMirror inherits VitePress' 16px otherwise)
const fontSize = EditorView.theme({
    '&': { fontSize: '13px' }
})

const extensions: Extension[] = [basicSetup, latex(), oneDark, fontSize]

const code = ref<string>(showcase)
const preview = ref<HTMLIFrameElement | null>(null)
const gutter = ref<HTMLDivElement | null>(null)

const onCmReady = () => {
    if (preview.value)
        compile(code.value, preview.value)
}

const onCmCodeChange = (state: EditorState) => {
    // code.value = state.doc.toString()
    if (preview.value)
        compile(state.doc.toString(), preview.value)
}


// zoom of the output: Ctrl+wheel (also trackpad pinch) over the preview, or the buttons

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

const zoomRef = ref(1)

const zoomTo = (z: number) => {
    zoomRef.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100))
    if (preview.value)
        zoom(preview.value, zoomRef.value)
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

// wheel events inside the iframe don't reach this page: listen in each document the iframe loads
const onPreviewLoad = () => {
    const doc = preview.value?.contentDocument
    if (!doc)
        return
    // passive:false because onWhell actually calls preventDefault()
    doc.addEventListener('wheel', onWheel, { passive: false })
    zoom(preview.value!, zoomRef.value)
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
                    :style="{ width: '100%', height: '100%' }"
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
                <button title="Zoom out (Ctrl+wheel)" :disabled="zoom <= MIN_ZOOM" @click="zoomOut">−</button>
                <button title="Reset zoom" @click="zoomTo(1)">{{ Math.round(zoomRef * 100) }}%</button>
                <button title="Zoom in (Ctrl+wheel)" :disabled="zoom >= MAX_ZOOM" @click="zoomIn">+</button>
            </div>
        </div>
    </div>
</template>


<style scoped>
#playground {
    margin: 0;
    height: 100%;
    display: grid;
    grid-template-rows: 100%;
    grid-template-columns: 1fr 6px 1fr;
    grid-template-areas: 'latex gutter preview';
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
}

/*
Target CodeMirror's core web component layout directly.
This treats whatever element the wrapper generates as a strict layout block.
*/
.absolute-container > div,
.absolute-container :deep(.cm-editor) {
    height: 100% !important;
    width: 100% !important;
}

/* Ensure inner scroll tracks do not bubble up layout shifts to split-grid */
.absolute-container :deep(.cm-scroller) {
    overflow: auto;
    scrollbar-gutter: stable; /* Keeps layout tracking static when scrollbars toggle */
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

/* zoom buttons, floating at the top right of the output */
.zoom-controls {
    position: absolute;
    top: 8px;
    right: 24px;    /* leave room for the iframe's scrollbar */
    display: flex;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    color: #333;
    opacity: 0.5;
    transition: opacity 0.2s;
    overflow: hidden;
}

.zoom-controls:hover {
    opacity: 1;
}

.zoom-controls button {
    padding: 2px 8px;
    min-width: 28px;
    font-variant-numeric: tabular-nums;
}

.zoom-controls button + button {
    border-left: 1px solid #ccc;
}

.zoom-controls button:hover:not(:disabled) {
    background: #eee;
}

.zoom-controls button:disabled {
    color: #bbb;
    cursor: default;
}

#gutter {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: col-resize;
}

#gutter::before {
    display: block;
    content: '';
    width: 2px;
    height: 40px;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
}

#gutter:hover::before {
    border-color: #999;
}
</style>
