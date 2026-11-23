import { parse, HtmlGenerator } from 'latex.js'
import { hyphenateSync } from 'hyphen/en'

import { ErrorFormatter } from './ErrorFormatter.ts'
import errorCss from './error.scss?inline'


/**
 * Handle same-page links in the given (iframe-)document with one delegated listener.
 * Call it for each document the iframe loads; it survives LaTeXPreview.compile() replacing the body.
 */
function handleLinks(doc: Document)
{
    // Same-page links in an srcdoc iframe would load the parent page into the frame, see
    // https://stackoverflow.com/questions/50657574/iframe-with-srcdoc-same-page-links-load-the-parent-page-in-the-frame
    // so use scrollIntoView instead
    doc.addEventListener('click', (e: MouseEvent) => {
        // no instanceof: the event comes from the iframe's realm
        const t = e.target as Element | null
        const a = typeof t?.closest === 'function' ? t.closest('a[href^="#"]') : null
        if (!a) return

        e.preventDefault()
        const id = decodeURIComponent(a.getAttribute('href')!.substring(1))
        a.ownerDocument.getElementById(id)?.scrollIntoView()
    })
}



function showError(doc: Document, text: string)
{
    const pre = doc.createElement('pre')
    pre.className = 'error'
    pre.textContent = text      // not innerHTML: the message and the excerpt can contain < and &
    doc.body.replaceChildren(pre)
}


export interface LaTeXPreviewOptions
{
    /**
     * absolute URL of the directory with the LaTeX.js css/, fonts/ and js/ folders
     */
    baseURL: string

    /**
     * called after each compile with the error, or null if compiling succeeded
     */
    onCompiled?: (error: unknown) => void

    /**
     * wheel events inside the iframe (they don't reach the parent page)
     */
    onWheel?: (e: WheelEvent) => void
}

/**
 * Compiles LaTeX into an iframe and keeps its state: zoom, scroll position across errors, debouncing.
 * Call attach() on each load event of the iframe.
 */
export class LaTeXPreview
{
    #generator: HtmlGenerator | null = null
    #source: string | null = null

    #iframe: HTMLIFrameElement | null = null
    #compileTimer: ReturnType<typeof setTimeout> | undefined
    #scrollY = 0
    #zoom = 1
    readonly #options: LaTeXPreviewOptions

    constructor(options: LaTeXPreviewOptions)
    {
        this.#options = options
    }


    /**
     * Set up the document the iframe just loaded.
     */
    attach(iframe: HTMLIFrameElement)
    {
        this.#iframe = iframe

        const doc = iframe.contentDocument
        if (!doc)
            return

        handleLinks(doc)

        // passive:false because onWheel may call preventDefault()
        if (this.#options.onWheel)
            doc.addEventListener('wheel', this.#options.onWheel, { passive: false })

        this.applyZoom()

        // the initial about:blank finished loading (no srcdoc yet): an earlier compile() had to skip it
        if (!iframe.srcdoc && this.#source !== null)
            this.compile()
    }


    get zoom(): number { return this.#zoom }

    /** Zoom the output, keeping the relative scroll position. */
    set zoom(z: number)
    {
        this.#zoom = z
        this.applyZoom()
    }

    private applyZoom()
    {
        const el = this.#iframe?.contentDocument?.scrollingElement
        if (!el)
            return

        const fx = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)
        const fy = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)

        this.setDocumentZoom()

        el.scrollLeft = fx * (el.scrollWidth - el.clientWidth)
        el.scrollTop = fy * (el.scrollHeight - el.clientHeight)
    }

    private setDocumentZoom()
    {
        this.#iframe?.contentDocument?.documentElement.style.setProperty(
            'zoom',
            this.#zoom === 1 ? '' : String(this.#zoom)
        )
    }


    /**
     * Compile latex source into the iframe (default: the last source given). Errors are also shown in the iframe.
     * If the iframe isn't ready yet, the source is compiled once it is (see attach()).
     */
    compile(latex: string = this.#source ?? '')
    {
        // a pending debounced compile would only compile the same or older source again
        clearTimeout(this.#compileTimer)

        this.#source = latex

        const iframe = this.#iframe
        const doc = iframe?.contentDocument
        if (!iframe || !doc || doc.readyState !== 'complete' || !doc.body)
            return

        if (!this.#generator) {
            this.#generator = new HtmlGenerator({
                hyphenate: hyphenateSync
            })
        } else {
            this.#generator.reset();
        }

        let error: unknown = null

        try {
            const newDoc = parse(latex, { generator: this.#generator }).htmlDocument(this.#options.baseURL)

            // styles for the error messages below
            const errorStyle = newDoc.createElement('style')
            errorStyle.textContent = errorCss
            newDoc.head.appendChild(errorStyle)

            // don't reload all the styles and fonts if not needed!
            if (doc.head.innerHTML === newDoc.head.innerHTML) {
                const newBody = doc.adoptNode(newDoc.body)
                doc.documentElement.replaceChild(newBody, doc.body)
                doc.documentElement.style.cssText = newDoc.documentElement.style.cssText
                this.setDocumentZoom()
            } else {
                // loads a new document; attach() applies the zoom
                iframe.srcdoc = newDoc.documentElement.outerHTML
            }

            if (this.#scrollY) {
                iframe.contentWindow?.scrollTo(0, this.#scrollY)
                this.#scrollY = 0
            }
        } catch (e: unknown) {
            console.error(e)
            error = e

            // save scrolling position and restore on next successful compile
            if (!this.#scrollY)
                this.#scrollY = iframe.contentWindow?.pageYOffset ?? 0

            showError(doc, ErrorFormatter.format(e, latex))
        }

        this.#options.onCompiled?.(error)
    }

    /**
     * Call compile(), but only if the interval since the last call is at least `delay` ms (e.g. while typing).
     */
    compileDebounced(latex: string, delay = 250)
    {
        clearTimeout(this.#compileTimer)
        this.#compileTimer = setTimeout(() => this.compile(latex), delay)
    }
}
