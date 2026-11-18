#!/bin/bash

# Creates a Vite + React (TypeScript) app in react-app/, installs tmp/latex.js.tgz (see pack.sh) and uses latex.js
# in it, then builds it (type check + bundle). Run "npm run dev" in react-app/ afterwards to try it in the browser.

set -euo pipefail
cd "$(dirname "$0")"

rm -rf react-app
npm create --yes vite@9.3.4 react-app -- --template react-ts --no-interactive --no-immediate
cd react-app
npm install --silent --no-audit --no-fund
npm install --silent --no-audit --no-fund ../tmp/latex.js.tgz

cat > src/App.tsx <<'TSX'
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
TSX

npm run build
