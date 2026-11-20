import { EditorState, type Extension } from '@codemirror/state'
import {
    EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection,
    dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine
} from '@codemirror/view'
import { foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { closeBracketsKeymap } from '@codemirror/autocomplete'
import { lintGutter, lintKeymap, setDiagnostics, type Diagnostic } from '@codemirror/lint'
import { latex } from 'codemirror-lang-latex';
import { oneDark } from '@codemirror/theme-one-dark'

import { SyntaxError as LaTeXSyntaxError } from 'latex.js'


// editor font size (CodeMirror inherits VitePress' 16px otherwise)
const fontSize = EditorView.theme({
    '&': { fontSize: '13px' }
})

// editorSetup currently does what `basicSetup` from the `codemirror` package does;
// latex() already brings autocompletion (+ completionKeymap), closeBrackets and bracket matching,
// plus linting and hover tooltips, so no need for them here
const editorSetup: Extension[] = [
    // gutters
    lineNumbers(),
    highlightActiveLineGutter(),
    lintGutter(),
    foldGutter(),

    // display
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),   // used if the theme has no highlighting
    EditorView.lineWrapping,

    // editing
    history(),
    indentOnInput(),
    EditorState.allowMultipleSelections.of(true),
    rectangularSelection(),
    crosshairCursor(),

    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...lintKeymap
    ])
]

/** All extensions of the LaTeX editor. */
export const extensions: Extension[] = [
    editorSetup,
    latex({
        autoCloseTags: true,
        autoCloseBrackets: true,
        enableAutocomplete: true,
        enableLinting: false,       // we get the real parse errors (showErrors()); a linter would replace them
        enableTooltips: true
    }),
    oneDark,
    fontSize
]


/** Show a LaTeX.js error (or none) in the editor, at its position in the source. */
export function showErrors(view: EditorView, error: unknown)
{
    const diagnostics: Diagnostic[] = []

    // other errors have no position; they are only shown in the preview
    if (error instanceof LaTeXSyntaxError) {
        const length = view.state.doc.length
        const from = Math.min(error.location.start.offset, length)
        const to = Math.min(Math.max(error.location.end.offset, from + 1), length)
        diagnostics.push({ from, to, severity: 'error', source: 'LaTeX.js', message: error.message })
    }

    view.dispatch(setDiagnostics(view.state, diagnostics))
}
