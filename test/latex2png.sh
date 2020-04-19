#!/bin/bash

# pass latex code through stdin, then turn it into a png and save it to the filename $1

snippet=`cat`   # $(</dev/stdin)
tmpdir=$(mktemp -d --tmpdir XXXXXX)

echo "using $tmpdir"
cd $tmpdir

cat <<EOF > latex-snippet.tex
\documentclass[preview=true,border=0.4pt,convert={density=1200,size=20800x1200,outext=.png}]{standalone}
\begin{document}
$snippet
\end{document}
EOF

pdflatex -shell-escape latex-snippet.tex
cd -

if [ -n "$1" ]
then
    mv $tmpdir/latex-snippet.png $1
else
    echo "no destination given..."
fi

rm -r "$tmpdir"
