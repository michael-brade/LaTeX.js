<template>
  <div id="playground">
    <!-- Left side: editor -->
    <Codemirror
      id="latex-editor"
      v-model="code"
      :extensions="extensions"
      :style="{ height: '100%' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="4"
      @ready="onCmReady"
      @change="onCmCodeChange"
    />

    <!-- Gutter / splitter -->
    <div id="gutter" ref="gutter"></div>

    <!-- Right side: LaTeX preview -->
    <iframe
      id="preview"
      ref="preview"
      sandbox="allow-same-origin allow-scripts"
    ></iframe>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

import { parse, HtmlGenerator, SyntaxError } from '../../../../dist/latex.mjs'
import en from 'hyphenation.en-us'
import Split from 'split-grid'
import showcase from '../../../showcase.tex?raw'

const extensions = [basicSetup, javascript(), oneDark]

// --- generator + helpers -----------------------------------------------------
function getAssetsBase(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.location.origin + '/latexjs/'
}


let generator: HtmlGenerator | null = null

function getGenerator() {
  if (typeof document === 'undefined') return null // SSR
  if (!generator) {
    generator = new HtmlGenerator({
      hyphenate: true,
      languagePatterns: en,
      styles: ['css/error.css']
    })
  }
  return generator
}

let scrollY = 0

function links() {
  const as = document.getElementsByTagName('a')
  for (let i = 0; i < as.length; i++) {
    const href = as[i].getAttribute('href')
    if (!href || !href.startsWith('#')) continue

    as[i].addEventListener('click', ev => {
      ev.preventDefault()
      const targetId = href.substring(1)
      const te = document.getElementById(targetId)
      if (!te || !document.scrollingElement) return
      document.scrollingElement.scrollTop = te.getBoundingClientRect().top
    })
  }
}

function definedOrElse<T>(value: T | undefined, fallback: T): T {
  return typeof value !== 'undefined' ? value : fallback
}

function excerpt(txt: string, o: number) {
  const l = txt.length
  let b = o - 20
  if (b < 0) b = 0
  let e = o + 20
  if (e > l) e = l

  const hex = (ch: string) => ch.charCodeAt(0).toString(16).toUpperCase()

  const extract = (txt: string, pos: number, len: number) =>
    txt
      .substr(pos, len)
      .replace(/\\/g, '\\\\')
      .replace(/\x08/g, '\\b')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\f/g, '\\f')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x07\x0B\x0E\x0F]/g, ch => '\\x0' + hex(ch))
      .replace(/[\x10-\x1F\x80-\xFF]/g, ch => '\\x' + hex(ch))
      .replace(/[\u0100-\u0FFF]/g, ch => '\\u0' + hex(ch))
      .replace(/[\u1000-\uFFFF]/g, ch => '\\u' + hex(ch))

  return {
    prolog: extract(txt, b, o - b),
    token: extract(txt, o, 1),
    epilog: extract(txt, o + 1, e - (o + 1))
  }
}

function errorMessage(e: any, noFinalNewline?: boolean) {
  const l = e.location
  const prefix1 = 'line ' + e.line + ' (column ' + e.column + '): '
  let prefix2 = ''
  for (let i = 0; i < prefix1.length + l.prolog.length; i++) prefix2 += '-'
  const msg =
    prefix1 +
    l.prolog +
    l.token +
    l.epilog +
    '\n' +
    prefix2 +
    '^\n' +
    e.message +
    (noFinalNewline ? '' : '\n')
  return msg
}

// core compile function reused from VuePress version, with SSR guard
function compile(latex: string, iframe: HTMLIFrameElement) {
  if (typeof document === 'undefined') return // SSR

  const generator = getGenerator()
  if (!generator) return

  const doc = iframe.contentDocument
  if (!doc || doc.readyState !== 'complete') return

  try {
    generator.reset()
    const baseURL = getAssetsBase();
    const newDoc = parse(latex, { generator }).htmlDocument(baseURL)

    const linkScript = newDoc.createElement('script')
    linkScript.text =
      'document.addEventListener("DOMContentLoaded", ' + links.toString() + ')'
    newDoc.head.appendChild(linkScript)

    if (doc.head.innerHTML === newDoc.head.innerHTML) {
      const newBody = doc.adoptNode(newDoc.body)
      doc.documentElement.replaceChild(newBody, doc.body)
      ;(doc.documentElement as HTMLElement).style.cssText =
        (newDoc.documentElement as HTMLElement).style.cssText
    } else {
      iframe.srcdoc = newDoc.documentElement.outerHTML
    }

    if (scrollY) {
      iframe.contentWindow?.scrollTo(0, scrollY)
      scrollY = 0
    }
  } catch (e: any) {
    console.error(e)
    if (doc && iframe.contentWindow) {
      if (!scrollY) scrollY = iframe.contentWindow.pageYOffset
    }

    if (e instanceof SyntaxError) {
      const err = {
        line: definedOrElse(e.location?.start?.line, 0),
        column: definedOrElse(e.location?.start?.column, 0),
        message: e.message,
        found: definedOrElse(e.found, ''),
        expected: definedOrElse(e.expected, ''),
        location: excerpt(
          latex,
          definedOrElse(e.location?.start?.offset, 0)
        )
      }

      doc.body.innerHTML =
        '<pre class="error">ERROR: Parsing failure:\n\n' +
        errorMessage(err, true) +
        '</pre>'
    } else if (doc) {
      doc.body.innerHTML = '<pre class="error">ERROR: ' + e.message + '</pre>'
    }
  }
}

// --- component ---------------------------------------------------------------

export default defineComponent({
  name: 'LtxPlayground',
  components: { Codemirror },
  setup() {
    const code = ref(showcase)
    const preview = ref<HTMLIFrameElement | null>(null)
    const gutter = ref<HTMLDivElement | null>(null)

    const onCmReady = () => {
      if (preview.value) compile(code.value, preview.value)
    }

    const onCmCodeChange = (value: string) => {
      code.value = value
      if (preview.value) compile(value, preview.value)
    }

    onMounted(() => {
      if (gutter.value) {
        Split({
          columnGutters: [
            {
              track: 1,
              element: gutter.value
            }
          ]
        })
      }
    })

    return {
      code,
      extensions,
      preview,
      gutter,
      onCmReady,
      onCmCodeChange
    }
  }
})
</script>

<style scoped>
#playground {
  margin: 0;
  height: 100vh;
  display: grid;
  grid-template-rows: 100%;
  grid-template-columns: 1fr 6px 1fr;
  grid-template-areas: 'latex gutter preview';
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
