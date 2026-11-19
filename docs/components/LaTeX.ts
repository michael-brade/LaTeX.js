import { parse, HtmlGenerator, SyntaxError } from 'latex.js'
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


// take 20 chars before and after o from txt
function excerpt(txt: string, o: number)
{
    const l = txt.length

    // clamp boundaries safely between 0 and text length
    const b = Math.max(0, o - 20)
    const e = Math.min(l, o + 20)

    const hex = (ch: string) => ch.charCodeAt(0).toString(16).toUpperCase()

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
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, ch => '\\x0' + hex(ch))
            .replace(/[\x10-\x1F\x80-\xFF]/g, ch => '\\x' + hex(ch))
            .replace(/[\u0100-\u0FFF]/g, ch => '\\u0' + hex(ch))
            .replace(/[\u1000-\uFFFF]/g, ch => '\\u' + hex(ch))
    }

    return {
        prolog: extract(b, o),
        token: extract(o, o + 1),
        epilog: extract(o + 1, e)
    }
}

function errorMessage(e: any): string
{
    const { line, column, location: l, message } = e

    const prefix1 = `line ${line} (column ${column}): `
    const prefix2 = '-'.repeat(prefix1.length + l.prolog.length)

    return `${prefix1}${l.prolog}${l.token}${l.epilog}\n` +
           `${prefix2}^\n` +
           `${message}`
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
    } catch (e: any) {
        console.error(e)

        // save scrolling position and restore on next successful compile
        if (!scrollY)
            scrollY = iframe.contentWindow?.pageYOffset ?? 0


        if (e instanceof SyntaxError) {
            doc.body.innerHTML ='<pre class="error">ERROR: Parsing failure:\n\n' +
                errorMessage({
                    line: e.location?.start?.line ?? 0,
                    column: e.location?.start?.column ?? 0,
                    message: e.message,
                    found: e.found ?? '',
                    expected: e.expected ?? '',
                    location: excerpt(latex, e.location?.start?.offset ?? 0)
                }) +
            '</pre>'
        } else {
            doc.body.innerHTML = '<pre class="error">ERROR: ' + e.message + '</pre>'
        }
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
