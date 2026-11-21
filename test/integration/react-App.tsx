import { useState } from 'react'
import { defineLaTeXJSComponent } from 'latex.js'


defineLaTeXJSComponent()

// JSX typings for <latex-js> (latex.js can't ship them without depending on React's types)
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'latex-js': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                baseURL?: string
                hyphenate?: 'true' | 'false'
                macros?: string
                stylesheet?: string
            }
        }
    }
}

// letters and digits are set in CMU; the symbols (not in CMU), \mathbb and the big operators need the KaTeX fonts
const initialSource = String.raw`
    Hi, this is \LaTeX.js in \textbf{React}:
    $e^{i\pi} + 1 = 0$,
    $x \in \mathbb{R}$,
    $\infty \le \Rightarrow \forall \exists \partial \nabla \emptyset \langle a \rangle$,
    $\displaystyle \sum_{i=1}^n \int_0^1 \left( \frac{a}{b} \right)$.`


function App() {
    const [source, setSource] = useState(initialSource)

    return (
        <>
            {/** you may even edit the LaTeX source live */}
            <textarea value={source} onChange={e => setSource(e.target.value)} rows={4} cols={80} />

            {/* css/, fonts/ and js/ of latex.js are served from public/latexjs/ (see react.sh); <latex-js>
                renders again whenever source changes */}
            <latex-js baseURL="latexjs/" hyphenate="false">{source}</latex-js>
        </>
    )
}

export default App
