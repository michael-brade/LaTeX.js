<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Split from 'split-grid'

// CodeMirror
import CodeMirror from 'vue-codemirror6'
import { basicSetup } from 'codemirror'

import type { LanguageSupport } from '@codemirror/language';
import type { EditorState, Extension } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';
import { latex } from 'codemirror-lang-latex';
import { oneDark } from '@codemirror/theme-one-dark'

// LaTeX.js
import { compile } from './LaTeX.ts'
import showcase from '../showcase.tex?raw'


const extensions: Extension[] = [basicSetup, latex(), oneDark]

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

onMounted(() => {
    if (gutter.value) {
        Split({
            columnGutters: [{
                track: 1,
                element: gutter.value
            }]
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
        <div class="pane-wrapper">
            <div class="preview-content">
                <iframe id="preview" ref="preview"
                    sandbox="allow-same-origin allow-scripts"
                ></iframe>
            </div>
        </div>
    </div>
</template>


<style scoped>
#playground {
    margin: 0;
    height: 100vh;
    display: grid;
    grid-template-rows: 100%;
    grid-template-columns: 1fr 6px 1fr;
    grid-template-areas: 'latex gutter preview';
}

.pane-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
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
