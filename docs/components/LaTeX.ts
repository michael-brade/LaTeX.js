import { parse, HtmlGenerator, SyntaxError } from 'latex.js'
import en from 'hyphenation.en-us'



let generator: HtmlGenerator | null = null


function links()
{
    const as: HTMLCollectionOf<HTMLAnchorElement> = document.getElementsByTagName('a')
    for (const a of as) {
        const href = a.getAttribute('href')
        if (!href || !href.startsWith('#'))
            continue

        a.addEventListener('click', (e: PointerEvent) => {
            e.preventDefault()
            const target = href.substring(1)
            const targetEl = document.getElementById(target)
            if (!targetEl || !document.scrollingElement)
                return
            document.scrollingElement.scrollTop = targetEl.getBoundingClientRect().top
        })
    }
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



let scrollY = 0


// core compile function with SSR guard
export function compile(latex: string, iframe: HTMLIFrameElement)
{
    if (typeof window === 'undefined' || typeof document === 'undefined')
        return // SSR

    const doc = iframe.contentDocument
    if (!doc || doc.readyState !== 'complete')
        return

    if (!generator) {
        generator = new HtmlGenerator({
            hyphenate: true,
            languagePatterns: en,
            styles: ['css/error.css']
        })
    } else {
        generator.reset();
    }

    try {
        const baseURL = window.location.origin + '/latexjs/'
        const newDoc = parse(latex, { generator }).htmlDocument(baseURL)

        // we need to disable normal processing of same-page links in the iframe
        // see also https://stackoverflow.com/questions/50657574/iframe-with-srcdoc-same-page-links-load-the-parent-page-in-the-frame
        const linkScript = newDoc.createElement('script')
        linkScript.text = 'document.addEventListener("DOMContentLoaded", ' + links.toString() + ')'
        newDoc.head.appendChild(linkScript)

        // don't reload all the styles and fonts if not needed!
        if (doc.head.innerHTML === newDoc.head.innerHTML) {
            const newBody = doc.adoptNode(newDoc.body)
            doc.documentElement.replaceChild(newBody, doc.body)
            doc.documentElement.style.cssText = newDoc.documentElement.style.cssText
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
        if (iframe.contentWindow && !scrollY)
            scrollY = iframe.contentWindow.pageYOffset


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
