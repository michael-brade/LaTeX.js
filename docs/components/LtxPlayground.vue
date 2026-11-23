<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

import Split from 'split-grid'
import CodeMirror from 'vue-codemirror6'
import type { EditorView } from '@codemirror/view'
import type { EditorState } from '@codemirror/state'

import { extensions, showErrors } from './editor.ts'
import { LaTeXPreview } from './LaTeX.ts'
import { useZoom } from './useZoom.ts'
import showcase from '../showcase.tex?raw'


const code = ref<string>(showcase)
const previewFrame = ref<HTMLIFrameElement | null>(null)
const gutter = ref<HTMLDivElement | null>(null)

// not a ref: Vue's proxy would get in the way of CodeMirror
let view: EditorView | null = null


// zoom of the output: Ctrl+wheel over the preview, or the buttons
const { zoom, canZoomIn, canZoomOut, zoomTo, zoomIn, zoomOut, onWheel } = useZoom(z => preview.zoom = z)

const preview = new LaTeXPreview({
    // absolute URL of the LaTeX.js css/, fonts/ and js/ folders (docs/public/latexjs/), respecting the site's base
    baseURL: () => window.location.origin + withBase('/latexjs/'),
    onCompiled: error => view && showErrors(view, error),
    onWheel
})

const onCmReady = ({ view: v }: { view: EditorView }) => {
    view = v
    preview.compile(v.state.doc.toString())
}

const onCmCodeChange = (state: EditorState) => preview.compileDebounced(state.doc.toString())


onMounted(() => {
    // In the built site the page is server-rendered: the iframe's initial about:blank can finish loading before
    // hydration adds the load listener, and then preview.attach() never runs.
    //
    // attach() may now be called by onMounted and by the load listener, so attach() must ignore a second call.
    const iframe = previewFrame.value
    if (iframe?.contentDocument?.readyState === 'complete')
        preview.attach(iframe)

    if (gutter.value) {
        Split({
            columnGutters: [{
                track: 1,
                element: gutter.value
            }],
            onDragEnd: () => {
                // microscopic opacity shift forces Chrome to reset the scroll tree
                // without this, scrolling with the mousewheel is not possible after using the splitter
                const iframe = previewFrame.value
                if (iframe) {
                    iframe.style.opacity = '0.999';
                    requestAnimationFrame(() => iframe.style.opacity = '1');
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
            <iframe id="preview" ref="previewFrame"
                sandbox="allow-same-origin allow-scripts"
                @load="previewFrame && preview.attach(previewFrame)"
            ></iframe>

            <div class="zoom-controls">
                <button title="Zoom out (Ctrl+wheel)" :disabled="!canZoomOut" @click="zoomOut">−</button>
                <button title="Reset zoom" @click="zoomTo(1)">{{ Math.round(zoom * 100) }}%</button>
                <button title="Zoom in (Ctrl+wheel)" :disabled="!canZoomIn" @click="zoomIn">+</button>
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
