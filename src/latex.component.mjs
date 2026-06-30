import { parse } from './parser/latex-parser.pegjs'
import { HtmlGenerator } from './html-generator.ls'

export let LaTeXJSComponent = null

// fallback for environments without import.meta.url
const DEFAULT_BASE_PATH = typeof import.meta?.url !== 'undefined' ? import.meta.url : window.location.href

// only define LaTeXJSComponent in browser context, i.e., if HTMLElement exists
if (typeof HTMLElement !== 'undefined') {

  LaTeXJSComponent = class extends HTMLElement
  {
    constructor()
    {
      super()
      this.shadow = this.attachShadow({ mode: 'open' })
      this._observer = null
      // wait for some LaTeX source to appear in the upgrade-case
      if (!this.textContent) {
        this._observer = new MutationObserver(() => {
          if (this.textContent) {
            // no longer need to watch for change
            // TODO: actually, we could keep watching to support editing!
            this._observer.disconnect()
            this._observer = null
            this.onContentReady()
          }
        })
        this._observer.observe(this, { childList: true })
      } else {
        this.onContentReady()
      }
    }

    async onContentReady()
    {
      // empty DOM
      this.shadow.innerHTML = ''

      // read options
      const hyphenate = this.getAttribute("hyphenate") !== "false"

      const basePath = this.getAttribute("baseURL") || DEFAULT_BASE_PATH

      let CustomMacros
      if (this.hasAttribute("macros")) {
        const macrosPath = new URL(this.getAttribute("macros"), basePath).href
        CustomMacros = (await import(/* @vite-ignore */ macrosPath)).default
      }

      // parse
      const generator = parse(this.textContent, {
        generator: new HtmlGenerator({ hyphenate, CustomMacros })
      })

      // create DOM
      const page = document.createElement("div")
      page.className = "page"
      page.appendChild(generator.domFragment())

      // load optional stylesheet
      if (this.hasAttribute("stylesheet")) {
        const style = document.createElement("link")
        style.type = "text/css"
        style.rel = "stylesheet"
        style.href = this.getAttribute("stylesheet")
        this.shadow.appendChild(style)
      }

      // inject styles, scripts, and page
      this.shadow.appendChild(generator.stylesAndScripts(basePath))
      this.shadow.appendChild(page)

      generator.applyLengthsAndGeometryToDom(this.shadow.host)

      // we need to add CMU fonts to the parent page (if they weren't added yet)
      const pDoc = this.ownerDocument
      const cmu = new URL("./fonts/cmu.css", basePath)

      // check if fonts have been included already
      const exists = Array.from(pDoc.querySelectorAll('link')).some(link => link.href === cmu.href)

      if (!exists) {
        const linkEl = pDoc.createElement("link")
        linkEl.type = "text/css"
        linkEl.rel = "stylesheet"
        linkEl.href = cmu.href
        pDoc.head.appendChild(linkEl)
      }
    }

    disconnectedCallback()
    {
      // cleanup to avoid memory leaks
      if (this._observer)
        this._observer.disconnect()
    }
  }
}
