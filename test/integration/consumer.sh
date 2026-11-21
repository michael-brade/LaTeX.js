#!/bin/bash

# Installs tmp/latex.js.tgz (see pack.sh) into a fresh project and checks that it works for consumers:
#  - at runtime: the node API examples in test/api (CommonJS and ESM) and the CLI
#  - its types: strict, without skipLibCheck, for ESM (bundler, node16, nodenext) and CommonJS (node16, nodenext)

set -euo pipefail
cd "$(dirname "$0")"

root=$(cd ../.. && pwd)
tsc="$root/node_modules/.bin/tsc"
dir=tmp/consumer

rm -rf $dir
mkdir -p $dir
cp ../api/node.cjs $dir/node.cjs
cp ../api/node.mjs $dir/node.mjs

cd $dir

cat > package.json <<'JSON'
{ "name": "consumer", "private": true, "type": "module" }
JSON

npm install --silent --no-audit --no-fund ../latex.js.tgz


echo "--- runtime"

expected='<p>Hi, this is a line of text.</p>'

for script in node.cjs node.mjs; do
    out=$(node $script)
    if [[ "$out" != *"$expected"* ]]; then
        echo "FAIL: $script: unexpected output:" >&2
        echo "$out" >&2
        exit 1
    fi
    echo "ok: $script"
done

out=$(echo 'A \textbf{bold} text.' | npx latex.js -b)
if [[ "$out" != *'<p>A <span class="bf">bold</span> text.</p>'* ]]; then
    echo "FAIL: CLI: unexpected output:" >&2
    echo "$out" >&2
    exit 1
fi
echo "ok: CLI"

# picture: svg.js needs the DOM globals when latex.js is loaded; -b: body only, which must not clone the SVG
# (TODO: add \multiput once svgdom can clone an svg's plain xmlns attribute, see patches/svgdom+*.patch)
picture='\setlength{\unitlength}{1cm}\begin{picture}(2,2)\put(0,0){\line(1,1){2}}\put(1,0){\circle{1}}\end{picture}'
for opt in "" -b; do
    out=$(echo "$picture" | npx latex.js $opt)
    if [[ "$out" != *'<line x1="0" y1="0" x2="75.591" y2="75.591"'* || "$out" != *'<circle r="18.8975px"'* ]]; then
        echo "FAIL: CLI $opt: picture: unexpected output:" >&2
        echo "$out" >&2
        exit 1
    fi
    echo "ok: CLI $opt picture"
done


echo "--- types"

# .mts is always ESM, .cts always CommonJS, regardless of "type" in package.json
code='
import { parse, HtmlGenerator, SyntaxError, LaTeXJSComponent, defineLaTeXJSComponent } from "latex.js";
import type { HtmlOptions } from "latex.js";

const options: Partial<HtmlOptions> = { hyphenate: false };
const generator: HtmlGenerator = parse("Hi.", { generator: new HtmlGenerator(options) });
const fragment: DocumentFragment = generator.domFragment();
const html: string = generator.htmlDocument().documentElement.outerHTML;
const isError: boolean = new Error() instanceof SyntaxError;
customElements.define("latex-js", LaTeXJSComponent);
defineLaTeXJSComponent("latex-js-2");
const component: HTMLElement = new LaTeXJSComponent();

export { fragment, html, isError };
'
echo "$code" > esm.mts
echo "$code" > cjs.cts

check() {   # <module> <moduleResolution> <file>
    cat > tsconfig.json <<JSON
{
    "compilerOptions": {
        "module": "$1",
        "moduleResolution": "$2",
        "target": "es2022",
        "lib": ["es2022", "dom"],
        "types": [],
        "strict": true,
        "skipLibCheck": false,
        "noEmit": true
    },
    "files": ["$3"]
}
JSON
    "$tsc" -p tsconfig.json
    echo "ok: $3 with module $1, moduleResolution $2"
}

check esnext   bundler  esm.mts
check node16   node16   esm.mts
check nodenext nodenext esm.mts
check node16   node16   cjs.cts
check nodenext nodenext cjs.cts
