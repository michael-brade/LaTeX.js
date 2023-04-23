#!/bin/bash

set -e

rm -rf react-app
npx create-react-app react-app
cd react-app
npm install ../../../    # npm i latex.js
sed -i "1s|^|import { parse, HtmlGenerator, LaTeXJSComponent } from 'latex.js';\n|" src/App.js
sed -i '4s|^|\ncustomElements.define("latex-js", LaTeXJSComponent);\n|' src/App.js
npm start
