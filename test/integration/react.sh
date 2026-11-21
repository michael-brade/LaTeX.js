#!/bin/bash

# Creates a Vite + React (TypeScript) app in react-app/, installs tmp/latex.js.tgz (see pack.sh) and uses latex.js
# in it, then builds it (type check + bundle) and checks in headless Chrome that it renders with the LaTeX styles
# and fonts (react-check.ts). Run "npm run dev" in react-app/ afterwards to try it in the browser.

set -euo pipefail
cd "$(dirname "$0")"

rm -rf react-app
npm create --yes vite@9.3.4 react-app -- --template react-ts --no-interactive --no-immediate
cd react-app
npm install --silent --no-audit --no-fund
npm install --silent --no-audit --no-fund ../tmp/latex.js.tgz

# latex.js references its stylesheets, fonts and scripts by URL: serve them from public/latexjs/
mkdir -p public/latexjs
cp -r node_modules/latex.js/dist/{css,fonts,js} public/latexjs/

# the template's page styles (centered, gray text, dark mode) would get in the way of the LaTeX look
sed -i "/import '.\/index.css'/d" src/main.tsx

cp ../react-App.tsx src/App.tsx

npm run build

cd ..
npx tsx react-check.ts react-app/dist
