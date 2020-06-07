import { parse } from './latex-parser'
import { HtmlGenerator } from './html-generator'

export let LaTeXJSComponent = null

// only define LaTeXJSComponent in browser context, i.e., if HTMLElement exists
if (typeof HTMLElement != 'undefined') {
  //  path of this script
  let path = import.meta.url

  LaTeXJSComponent = class extends HTMLElement {
    constructor() {
      super()
      this.shadow =  this.attachShadow({mode: 'open'})
      // wait for some LaTeX source to appear in the upgrade-case
      if (!this.textContent) {
        const observer = new MutationObserver(mutationList => {
          if (this.textContent) {
            // no longer need to watch for change
            // TODO: actually, we could keep watching to support editing!
            observer.disconnect();
            this.onContentReady();
          }
        })
        observer.observe(this, {
          childList: true
        })
      } else {
        this.onContentReady();
      }
    }

    async onContentReady() {
      // empty DOM
      while (this.shadow.lastChild) {
        this.shadow.lastChild.remove()
      }

      // read options
      const hyphenate = this.getAttribute("hyphenate") !== "false"

      if (this.hasAttribute("baseURL"))
        path = this.getAttribute("baseURL")

      let CustomMacros;
      if (this.hasAttribute("macros"))
        CustomMacros = (await import(this.getAttribute("macros"))).default


      // parse
      const generator = parse(this.textContent, { generator: new HtmlGenerator({ hyphenate, CustomMacros }) })

      // create DOM
      let page = document.createElement("div")
      page.setAttribute("class", "page")
      page.appendChild(generator.domFragment())
      if (this.hasAttribute("stylesheet")) {
        const style = document.createElement("link")
        style.type = "text/css"
        style.rel = "stylesheet"
        style.href = this.getAttribute("stylesheet")
        this.shadow.appendChild(style)
      }

      this.shadow.appendChild(generator.stylesAndScripts(path))
      this.shadow.appendChild(page)

      generator.applyLengthsAndGeometryToDom(this.shadow.host)

      // we need to add CMU fonts to the parent page (if they weren't added yet)
      const pDoc = this.ownerDocument
      const links = pDoc.querySelectorAll('link')
      const cmu = new URL("fonts/cmu.css", path)

      for (let link of links) {
        if (link.href == cmu.href)
          return
      }

      const linkEl = pDoc.createElement("link")
      linkEl.type = "text/css"
      linkEl.rel = "stylesheet"
      linkEl.href = cmu.href

      pDoc.head.appendChild(linkEl)
    }

    connectedCallback() { }
  }
}