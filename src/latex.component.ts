import { parse } from './parser/latex-parser.pegjs'
import { HtmlGenerator } from './generator/html/generator.ts'


// fallback for environments without import.meta.url (CJS/UMD builds); there is no location in Node
const DEFAULT_BASE_PATH: string | undefined = import.meta?.url ?? globalThis.location?.href

// there is no HTMLElement outside of the browser (Node, SSR): extend a stand-in empty class there,
// so that this module can still be imported; the component can only be used in a browser, though
const Base = (typeof HTMLElement !== 'undefined' ?
    HTMLElement :
    class {}
) as typeof HTMLElement

/**
 * The <latex-js> custom element class. It renders its text content as LaTeX into its shadow DOM, and renders
 * again whenever the content or one of its attributes changes.
 *
 * Register it with
 *   `defineLaTeXJSComponent()`
 * or with
 *   `customElements.define("latex-js", LaTeXJSComponent)`
 *
 * Attributes:
 *  - `baseURL`: where to load css/, fonts/ and js/ from, may be relative to the page
 *    (default: the location of the latex.js module)
 *  - `hyphenate`: "false" disables hyphenation
 *  - `macros`: URL of a module with CustomMacros as default export
 *  - `stylesheet`: URL of an additional stylesheet
 */
export class LaTeXJSComponent extends Base
{
    #shadow: ShadowRoot
    #observer: MutationObserver
    #renderQueued = false
    #renderId = 0

    constructor()
    {
        super()
        this.#shadow = this.attachShadow({ mode: 'open' })
        // watch the content: when parsed, an element can be created before its content is there, and frameworks
        // like React change the text later
        this.#observer = new MutationObserver(() => this.#queueRender())
    }

    /**
     * Custom component lifecycle callback.
     * Called each time the element is added to the document.
     */
    connectedCallback(): void
    {
        this.#observer.observe(this, {
            childList: true,
            characterData: true,
            subtree: true
        })
        this.#queueRender()
    }

    /**
     * Custom component lifecycle callback.
     * Called each time the element is removed from the document.
     */
    disconnectedCallback(): void
    {
        this.#observer.disconnect()
    }

    // HTML attribute names are lowercase
    static observedAttributes = ["baseurl", "hyphenate", "macros", "stylesheet"]

    /**
     * Custom component lifecycle callback.
     * Called when attributes are changed, added, removed, or replaced.
     */
    attributeChangedCallback(): void
    {
        if (this.isConnected)
            this.#queueRender()
    }

    // render only once for several changes in a row (e.g. attributes and content set by a framework)
    #queueRender(): void
    {
        if (this.#renderQueued)
            return

        this.#renderQueued = true
        queueMicrotask(() => {
            this.#renderQueued = false
            this.#render().catch(e => console.error("<latex-js>:", e))
        })
    }

    async #render(): Promise<void>
    {
        const renderId = ++this.#renderId
        const source = this.textContent ?? ""

        // wait for some LaTeX source to appear
        if (!source.trim()) {
            this.#shadow.replaceChildren()
            return
        }

        // read options
        const hyphenate = this.getAttribute("hyphenate") !== "false"

        // resolve a relative baseURL against the page
        const baseAttr = this.getAttribute("baseURL")
        const basePath = baseAttr ? new URL(baseAttr, document.baseURI).href : DEFAULT_BASE_PATH

        let CustomMacros
        if (this.hasAttribute("macros")) {
            const macrosPath = new URL(this.getAttribute("macros")!, basePath).href
            CustomMacros = (await import(/* @vite-ignore */ macrosPath)).default

            // the content or the attributes changed while loading the macros: a newer render takes over
            if (renderId !== this.#renderId)
                return
        }

        // parse
        const generator = parse(source, {
            generator: new HtmlGenerator({ hyphenate, CustomMacros })
        })

        // create DOM
        const page = document.createElement("div")
        page.className = "page"
        page.appendChild(generator.domFragment())

        const stylesAndScripts = document.createDocumentFragment()

        // load optional user stylesheet
        if (this.hasAttribute("stylesheet")) {
            const userstyle = document.createElement("link")
            userstyle.type = "text/css"
            userstyle.rel = "stylesheet"
            userstyle.href = new URL(this.getAttribute("stylesheet")!, document.baseURI).href

            stylesAndScripts.appendChild(userstyle)
        }

        // replace styles, scripts, and page
        stylesAndScripts.appendChild(generator.stylesAndScripts(basePath))
        this.#shadow.replaceChildren(stylesAndScripts, page)

        generator.applyLengthsAndGeometryToDom(this)

        // @font-face is ignored in a shadow DOM, so add the CMU and KaTeX fonts to the parent page
        // (if they weren't added yet)
        const pDoc = this.ownerDocument

        for (const fonts of [
            "./fonts/cmu.css",
            "./fonts/katex.css"
        ]) {
            const href = new URL(fonts, basePath).href

            // check if fonts have been included already
            const exists = Array.from(pDoc.querySelectorAll('link')).some(link => link.href === href)
            if (exists)
                continue

            const linkEl = pDoc.createElement("link")
            linkEl.type = "text/css"
            linkEl.rel = "stylesheet"
            linkEl.href = href
            pDoc.head.appendChild(linkEl)
        }
    }
}


/**
 * Registers LaTeXJSComponent as custom element `name` (default: "latex-js").
 *
 * Does nothing if that element is already defined (e.g. with hot module reloading)
 * or outside of the browser.
 */
export function defineLaTeXJSComponent(name = "latex-js"): void
{
    if (typeof customElements === 'undefined' || customElements.get(name))
        return

    customElements.define(name, LaTeXJSComponent)
}
