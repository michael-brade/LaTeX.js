#!/bin/bash

# "npm pack" to tmp/latex.js.tgz, which the other integration tests install for testing

set -euo pipefail
cd "$(dirname "$0")"

root=$(cd ../.. && pwd)

if [ ! -f "$root/dist/types/index.d.ts" ] || [ ! -f "$root/bin/latex.js" ]; then
    echo "pack.sh: no build found, run 'npm run build' first" >&2
    exit 1
fi

rm -rf tmp
mkdir -p tmp
# --ignore-scripts: prepare (patch-package etc.) is for development and would print to stdout
tarball=$(cd "$root" && npm pack --silent --ignore-scripts --pack-destination "$OLDPWD/tmp")
mv "tmp/$tarball" tmp/latex.js.tgz
echo "packed tmp/latex.js.tgz"
