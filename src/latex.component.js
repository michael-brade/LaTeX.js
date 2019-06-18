import latexjs from "./index";

// path of this script
let path = import.meta.url

// define the <latex-js> tag
export default class extends HTMLElement {
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
    const generator = latexjs.parse(this.textContent, { generator: new latexjs.HtmlGenerator({ hyphenate, CustomMacros }) })

    if (this.hasAttribute("baseURL"))
      path = this.getAttribute("baseURL")

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

    this.shadow.appendChild(generator.stylesAndScripts(path))
    this.shadow.appendChild(page)

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
