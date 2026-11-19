import { parse, HtmlGenerator, SyntaxError as LaTeXSyntaxError } from 'latex.js'
import { hyphenateSync } from 'hyphen/en'

import errorCss from './error.scss?inline'


/**
 * Handle same-page links in the given (iframe-)document with one delegated listener.
 * Call it for each document the iframe loads; it survives compile() replacing the body.
 */
export function handleLinks(doc: Document)
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


function zoomDocument(doc: HTMLElement, z: number)
{
    doc.style.setProperty('zoom', z === 1 ? '' : String(z))
}

/**
 * Zoom the output in the given iframe, keeping the relative scroll position.
 * Also call it after the iframe loaded a new document.
 */
export function applyZoom(iframe: HTMLIFrameElement, z: number)
{
    const el = iframe.contentDocument?.scrollingElement
    if (!el)
        return

    const fx = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)
    const fy = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)

    // apply the zoom factor
    zoomDocument(iframe.contentDocument?.documentElement, z)

    el.scrollLeft = fx * (el.scrollWidth - el.clientWidth)
    el.scrollTop = fy * (el.scrollHeight - el.clientHeight)
}


type Excerpt = { prolog: string, token: string, epilog: string }

// take 20 chars before and after offset o from txt, making invisible characters visible
function excerpt(txt: string, o: number): Excerpt
{
    // clamp boundaries safely between 0 and text length
    const b = Math.max(0, o - 20)
    const e = Math.min(txt.length, o + 20)
    // the token is a whole code point, not half of a surrogate pair
    const t = o + ((txt.codePointAt(o) ?? 0) > 0xFFFF ? 2 : 1)

    const hex = (ch: string, digits: number) => ch.codePointAt(0)!.toString(16).toUpperCase().padStart(digits, '0')

    const extract = (start: number, end: number) => {
        if (start >= end) return ''

        return txt
            .slice(start, end)
            .replace(/\\/g, '\\\\')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\f/g, '\\f')
            .replace(/\r/g, '\\r')
            // remaining control and format characters (e.g. zero-width space, BOM), separators, non-breaking space;
            // everything else, like umlauts, is shown as is
            .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\u00A0]/gu, ch => {
                const c = ch.codePointAt(0)!
                return c <= 0xFF ? '\\x' + hex(ch, 2) : c <= 0xFFFF ? '\\u' + hex(ch, 4) : `\\u{${hex(ch, 0)}}`
            })
    }

    return {
        prolog: extract(b, o),
        token: extract(o, t),
        epilog: extract(t, Math.max(t, e))
    }
}

function errorMessage(e: LaTeXSyntaxError, latex: string): string
{
    const { line, column, offset } = e.location.start
    const l = excerpt(latex, offset)

    const prefix1 = `line ${line} (column ${column}): `
    // count code points, not UTF-16 units, so the caret lines up
    const prefix2 = '-'.repeat(prefix1.length + [...l.prolog].length)

    return `${prefix1}${l.prolog}${l.token}${l.epilog}\n` +
           `${prefix2}^\n` +
           `${e.message}`
}

function showError(doc: Document, text: string)
{
    const pre = doc.createElement('pre')
    pre.className = 'error'
    pre.textContent = text      // not innerHTML: the message and the excerpt can contain < and &
    doc.body.replaceChildren(pre)
}



let generator: HtmlGenerator | null = null
let scrollY = 0

/**
 * Compile latex source into the given iframe.
 * @param baseURL URL of the directory with the LaTeX.js css/, fonts/ and js/ folders
 */
export function compile(latex: string, iframe: HTMLIFrameElement, baseURL: string)
{
    if (typeof window === 'undefined' || typeof document === 'undefined')
        return // SSR

    const doc = iframe.contentDocument
    if (!doc || doc.readyState !== 'complete' || !doc.body)
        return

    const curZoom = doc.documentElement.currentCSSZoom

    if (!generator) {
        generator = new HtmlGenerator({
            hyphenate: hyphenateSync
        })
    } else {
        generator.reset();
    }

    try {
        const newDoc = parse(latex, { generator }).htmlDocument(baseURL)

        // styles for the error messages below
        const errorStyle = newDoc.createElement('style')
        errorStyle.textContent = errorCss
        newDoc.head.appendChild(errorStyle)

        // don't reload all the styles and fonts if not needed!
        if (doc.head.innerHTML === newDoc.head.innerHTML) {
            const newBody = doc.adoptNode(newDoc.body)
            doc.documentElement.replaceChild(newBody, doc.body)
            doc.documentElement.style.cssText = newDoc.documentElement.style.cssText
            zoomDocument(doc.documentElement, curZoom)
        } else {
            iframe.srcdoc = newDoc.documentElement.outerHTML

            // var blob = new Blob([newDoc.documentElement.innerHTML], {type : 'text/html'});
            // iframe.src = URL.createObjectURL(blob);
        }

        if (scrollY) {
            iframe.contentWindow?.scrollTo(0, scrollY)
            scrollY = 0
        }
    } catch (e: unknown) {
        console.error(e)

        // save scrolling position and restore on next successful compile
        if (!scrollY)
            scrollY = iframe.contentWindow?.pageYOffset ?? 0


        if (e instanceof LaTeXSyntaxError)
            showError(doc, 'ERROR: Parsing failure:\n\n' + errorMessage(e, latex))
        else
            showError(doc, 'ERROR: ' + (e instanceof Error ? e.message : String(e)))
    }
}


let compileTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Call compile(), but only if the interval since the last call is at least `delay` ms (e.g. while typing).
 */
export function compileDebounced(latex: string, iframe: HTMLIFrameElement, baseURL: string, delay = 250)
{
    clearTimeout(compileTimer)
    compileTimer = setTimeout(() => compile(latex, iframe, baseURL), delay)
}
