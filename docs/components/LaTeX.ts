import { parse, HtmlGenerator, SyntaxError } from 'latex.js'
import en from 'hyphenation.en-us'



let generator: HtmlGenerator | null = null

function getGenerator()
{
    if (typeof document === 'undefined')
        return null // SSR

    if (!generator) {
        generator = new HtmlGenerator({
            hyphenate: true,
            languagePatterns: en,
            styles: ['css/error.css']
        })
    }
    return generator
}


function links()
{
    const as: HTMLCollectionOf<HTMLAnchorElement> = document.getElementsByTagName('a')
    for (const a of as) {
        const href = a.getAttribute('href')
        if (!href || !href.startsWith('#')) continue

        a.addEventListener('click', (e: PointerEvent) => {
            e.preventDefault()
            const targetId = href.substring(1)
            const target = document.getElementById(targetId)
            if (!target || !document.scrollingElement) return
            document.scrollingElement.scrollTop = target.getBoundingClientRect().top
        })
    }
}



function definedOrElse<T>(value: T | undefined, fallback: T): T
{
    return typeof value !== 'undefined' ? value : fallback
}

function excerpt(txt: string, o: number)
{
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

function errorMessage(e: any, noFinalNewline?: boolean)
{
    const l = e.location
    const prefix1 = 'line ' + e.line + ' (column ' + e.column + '): '
    let prefix2 = ''
    for (let i = 0; i < prefix1.length + l.prolog.length; i++)
        prefix2 += '-'
    const msg = prefix1 + l.prolog + l.token + l.epilog + '\n' +
        prefix2 + '^\n' + e.message + (noFinalNewline ? '' : '\n')

    return msg
}



function getAssetsBase(): string | undefined
{
    if (typeof window === 'undefined')
        return undefined

    return window.location.origin + '/latexjs/'
}

let scrollY = 0


// core compile function with SSR guard
export function compile(latex: string, iframe: HTMLIFrameElement)
{
    if (typeof document === 'undefined')
        return // SSR

    const generator = getGenerator()
    if (!generator)
        return

    const doc = iframe.contentDocument
    if (!doc || doc.readyState !== 'complete')
        return

    try {
        generator.reset()
        const baseURL = getAssetsBase()
        const newDoc = parse(latex, { generator }).htmlDocument(baseURL)

        const linkScript = newDoc.createElement('script')
        linkScript.text = 'document.addEventListener("DOMContentLoaded", ' + links.toString() + ')'
        newDoc.head.appendChild(linkScript)

        if (doc.head.innerHTML === newDoc.head.innerHTML) {
            const newBody = doc.adoptNode(newDoc.body)
            doc.documentElement.replaceChild(newBody, doc.body)
            doc.documentElement.style.cssText = newDoc.documentElement.style.cssText
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

            doc.body.innerHTML ='<pre class="error">ERROR: Parsing failure:\n\n' +
                errorMessage(err, true) +
            '</pre>'
        } else {
            doc.body.innerHTML = '<pre class="error">ERROR: ' + e.message + '</pre>'
        }
    }
}
