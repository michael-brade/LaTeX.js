import { useEffect, useRef } from 'react'
import { parse, HtmlGenerator, LaTeXJSComponent } from 'latex.js'

// the URL that latex.js loads its css/, fonts/ and js/ from; must be absolute
const baseURL = new URL(import.meta.env.BASE_URL + 'latexjs/', location.href).href

// the define() guard is for hot module reloading: an element can only be defined once
if (!customElements.get('latex-js'))
    customElements.define('latex-js', LaTeXJSComponent!)   // LaTeXJSComponent is null outside of the browser

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'latex-js': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                baseURL?: string
                hyphenate?: 'true' | 'false'
            }
        }
    }
}

// letters and digits are set in CMU; the symbols (not in CMU), \mathbb and the big operators need the KaTeX fonts
const source = 'Hi, this is \\LaTeX.js in \\textbf{React}: $e^{i\\pi} + 1 = 0$, $x \\in \\mathbb{R}$, '
    + '$\\infty \\le \\Rightarrow \\forall \\exists \\partial \\nabla \\emptyset \\langle a \\rangle$, '
    + '$\\displaystyle \\sum_{i=1}^n \\int_0^1 \\left( \\frac{a}{b} \\right)$.'


// renders LaTeX with the API: like <latex-js>, put it into a shadow DOM, since the latex.js stylesheets would
// otherwise style the whole page (html, body, :root)
function LaTeX({ children }: { children: string }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const host = ref.current!
        const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
        const generator = parse(children, { generator: new HtmlGenerator({ hyphenate: false }) })

        const page = document.createElement('div')
        page.className = 'page'
        page.appendChild(generator.domFragment())

        shadow.replaceChildren(generator.stylesAndScripts(baseURL), page)
        generator.applyLengthsAndGeometryToDom(host)
    }, [children])

    return <div ref={ref} className="latex-api" />
}


function App() {
    // @font-face doesn't work in a shadow DOM, so the fonts have to be loaded by the page (<latex-js> does this
    // itself, the LaTeX component above relies on it)
    useEffect(() => {
        const links = ['fonts/cmu.css', 'fonts/katex.css'].map(fonts => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = baseURL + fonts
            return document.head.appendChild(link)
        })
        return () => links.forEach(link => link.remove())
    }, [])

    return (
        <>
            <h2>latex.js API</h2>
            <LaTeX>{source}</LaTeX>

            <h2>&lt;latex-js&gt; web component</h2>
            <latex-js baseURL={baseURL} hyphenate="false">{source}</latex-js>
        </>
    )
}

export default App
