#!/bin/bash

# pass latex code through stdin, then turn it into a png and save it to the filename $1

if [ -z "$1" ]
then
    echo "error: no destination given; this script needs one argument (file or directory)"
    exit 1
fi

snippet=$(</dev/stdin)
tmpdir=$(mktemp -d --tmpdir XXXXXX)

echo "using $tmpdir"
cd "$tmpdir" || exit

cat <<EOF > latex-snippet.tex
\documentclass[preview=true,border=0.4pt,convert={density=1200,size=20800x1200,outext=.png}]{standalone}
\begin{document}
$snippet
\end{document}
EOF

pdflatex -shell-escape latex-snippet.tex
cd - || exit

mv "$tmpdir"/latex-snippet.png "$1"

rm -r "$tmpdir"
