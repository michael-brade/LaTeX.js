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


type Excerpt = { context: string[], prolog: string, token: string, epilog: string }

const EXCERPT_CONTEXT = 30      // max chars shown before and after the error position
const CONTEXT_LINES = 2         // max lines shown before the error line...
const CONTEXT_LINE_LENGTH = 2 * EXCERPT_CONTEXT + 1     // ...if they are at most this long

// a string with invisible characters made visible
function visible(s: string): string
{
    return s
        // a tab as one space keeps the caret aligned
        .replace(/\t/g, ' ')
        // other control and format characters (e.g. zero-width space, BOM), separators, non-breaking space;
        // not as \x.. or \u..., which would look like LaTeX
        .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\u00A0]/gu, ch =>
            `⟨U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}⟩`)
}

// length in code points, not UTF-16 units
const len = (s: string) => [...s].length

// The part of the line that contains offset o: at most EXCERPT_CONTEXT chars before and after it (… if cut off).
// If the line isn't cut off at the beginning, also up to CONTEXT_LINES short lines before it.
function excerpt(txt: string, o: number): Excerpt
{
    // without \r, so CRLF line endings don't show up as ⟨U+000D⟩
    const lines = txt.slice(0, o).split('\n').map(l => l.replace(/\r$/, ''))
    const linePrefix = lines.pop()!
    const lineRest = /^[^\r\n]*/.exec(txt.slice(o))![0]

    // the token is a whole code point, not half of a surrogate pair; empty at the end of the line
    const tokenLen = lineRest ? ((lineRest.codePointAt(0)! > 0xFFFF) ? 2 : 1) : 0
    const token = lineRest.slice(0, tokenLen)
    const rest = lineRest.slice(tokenLen)

    const prolog = linePrefix.length > EXCERPT_CONTEXT ? '…' + linePrefix.slice(-EXCERPT_CONTEXT) : linePrefix
    const epilog = rest.length > EXCERPT_CONTEXT ? rest.slice(0, EXCERPT_CONTEXT) + '…' : rest

    // context: the lines before, as long as they are short, without leading empty lines
    const context: string[] = []
    if (linePrefix.length <= EXCERPT_CONTEXT) {     // only if the error line isn't cut off at the beginning
        for (const l of lines.slice(-CONTEXT_LINES).reverse()) {
            if (len(l) > CONTEXT_LINE_LENGTH)
                break
            context.unshift(visible(l))
        }
        while (context.length && !context[0].trim())
            context.shift()
    }

    return { context, prolog: visible(prolog), token: visible(token), epilog: visible(epilog) }
}

/**
 * The error message with the source line (and maybe a few lines before it as context),
 * a caret pointing at the error position below it:
 *
 *                         \section{Intro}
 *                         Some text
 *     line 21 (column 8): \begin{abstsract}
 *     ---------------------------^
 *     unknown environment: abstsract
 */
function errorMessage(e: LaTeXSyntaxError, latex: string): string
{
    const { line, column, offset } = e.location.start
    const l = excerpt(latex, offset)

    const prefix1 = `line ${line} (column ${column}): `
    const prefix2 = '-'.repeat(prefix1.length + len(l.prolog))
    const indent = ' '.repeat(prefix1.length)

    return l.context.map(c => `${indent}${c}\n`).join('') +
           `${prefix1}${l.prolog}${l.token}${l.epilog}\n` +
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
let compileTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Compile latex source into the given iframe.
 * @param baseURL URL of the directory with the LaTeX.js css/, fonts/ and js/ folders
 * @returns the error if compiling failed (it is also shown in the iframe), otherwise null
 */
export function compile(latex: string, iframe: HTMLIFrameElement, baseURL: string): unknown
{
    // a pending debounced compile would only compile the same or older source again
    clearTimeout(compileTimer)

    if (typeof window === 'undefined' || typeof document === 'undefined')
        return null // SSR

    const doc = iframe.contentDocument
    if (!doc || doc.readyState !== 'complete' || !doc.body)
        return null

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

        return null
    } catch (e: unknown) {
        console.error(e)

        // save scrolling position and restore on next successful compile
        if (!scrollY)
            scrollY = iframe.contentWindow?.pageYOffset ?? 0


        if (e instanceof LaTeXSyntaxError)
            showError(doc, 'ERROR: Parsing failure:\n\n' + errorMessage(e, latex))
        else
            showError(doc, 'ERROR: ' + (e instanceof Error ? e.message : String(e)))

        return e
    }
}


/**
 * Call compile(), but only if the interval since the last call is at least `delay` ms (e.g. while typing).
 * @param onCompiled called with compile()'s result
 */
export function compileDebounced(latex: string, iframe: HTMLIFrameElement, baseURL: string,
                                 onCompiled?: (error: unknown) => void, delay = 250)
{
    clearTimeout(compileTimer)
    compileTimer = setTimeout(() => {
        const error = compile(latex, iframe, baseURL)
        onCompiled?.(error)
    }, delay)
}
