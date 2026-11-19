import { useEffect, useRef } from 'react'
import { parse, HtmlGenerator, LaTeXJSComponent } from 'latex.js'

customElements.define('latex-js', LaTeXJSComponent!)

function App() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const generator = parse('Hi, this is \\LaTeX.js in \\textbf{React}.', {
            generator: new HtmlGenerator({ hyphenate: false })
        })
        ref.current?.replaceChildren(generator.domFragment())
    }, [])

    return <div ref={ref} />
}

export default App
