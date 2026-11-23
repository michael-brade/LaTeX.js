import { SyntaxError as LaTeXSyntaxError } from 'latex.js'


type Excerpt = { context: string[], prolog: string, token: string, epilog: string }

/**
 * Formats the errors thrown by parse() as plain text, for a monospace font. A syntax error shows the source line (and
 * maybe a few lines before it as context), with a caret pointing at the error position below it:
 *
 *     ERROR: Parsing failure:
 *
 *                         \section{Intro}
 *                         Some text
 *     line 21 (column 8): \begin{abstsract}
 *     ---------------------------^
 *     unknown environment: abstsract
 */
export class ErrorFormatter
{
    static readonly #EXCERPT_CONTEXT = 30   // max chars shown before and after the error position
    static readonly #CONTEXT_LINES = 2      // max lines shown before the error line...
    static readonly #CONTEXT_LINE_LENGTH = 2 * ErrorFormatter.#EXCERPT_CONTEXT + 1  // ...if they are at most this long


    /**
     * The message for the error `e`. With the LaTeX source that was parsed, a syntax error also shows the source
     * line and where in it the error is; without, just the position.
     */
    static format(e: unknown, latex?: string): string
    {
        if (e instanceof LaTeXSyntaxError)
            return 'ERROR: Parsing failure:\n\n' + ErrorFormatter.#syntaxError(e, latex)

        return 'ERROR: ' + (e instanceof Error ? e.message : String(e))
    }


    static #syntaxError(e: LaTeXSyntaxError, latex?: string): string
    {
        const { line, column, offset } = e.location.start
        const prefix1 = `line ${line} (column ${column}): `

        if (latex === undefined)
            return prefix1 + e.message

        const l = ErrorFormatter.#excerpt(latex, offset)
        const prefix2 = '-'.repeat(prefix1.length + ErrorFormatter.#len(l.prolog))
        const indent = ' '.repeat(prefix1.length)

        return l.context.map(c => `${indent}${c}\n`).join('') +
               `${prefix1}${l.prolog}${l.token}${l.epilog}\n` +
               `${prefix2}^\n` +
               `${e.message}`
    }

    // The part of the line that contains offset o: at most EXCERPT_CONTEXT chars before and after it (… if cut off).
    // If the line isn't cut off at the beginning, also up to CONTEXT_LINES short lines before it.
    static #excerpt(txt: string, o: number): Excerpt
    {
        const MAX = ErrorFormatter.#EXCERPT_CONTEXT
        const visible = ErrorFormatter.#visible

        // without \r, so CRLF line endings don't show up as ⟨U+000D⟩
        const lines = txt.slice(0, o).split('\n').map(l => l.replace(/\r$/, ''))
        const linePrefix = lines.pop()!
        const lineRest = /^[^\r\n]*/.exec(txt.slice(o))![0]

        // the token is a whole code point, not half of a surrogate pair; empty at the end of the line
        const tokenLen = lineRest ? ((lineRest.codePointAt(0)! > 0xFFFF) ? 2 : 1) : 0
        const token = lineRest.slice(0, tokenLen)
        const rest = lineRest.slice(tokenLen)

        const prolog = linePrefix.length > MAX ? '…' + linePrefix.slice(-MAX) : linePrefix
        const epilog = rest.length > MAX ? rest.slice(0, MAX) + '…' : rest

        // context: the lines before, as long as they are short, without leading empty lines
        const context: string[] = []
        if (linePrefix.length <= MAX) {     // only if the error line isn't cut off at the beginning
            for (const l of lines.slice(-ErrorFormatter.#CONTEXT_LINES).reverse()) {
                if (ErrorFormatter.#len(l) > ErrorFormatter.#CONTEXT_LINE_LENGTH)
                    break
                context.unshift(visible(l))
            }
            while (context.length && !context[0].trim())
                context.shift()
        }

        return { context, prolog: visible(prolog), token: visible(token), epilog: visible(epilog) }
    }

    // a string with invisible characters made visible
    static #visible(s: string): string
    {
        return s
            // a tab as one space keeps the caret aligned
            .replace(/\t/g, ' ')
            // other control and format characters (e.g. zero-width space, BOM), separators, non-breaking space;
            // not as \x.. or \u..., which would look like LaTeX
            .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\u00A0]/gu, ch =>
                `⟨U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}⟩`)
    }

    // length in code points, not UTF-16 units
    static #len(s: string): number
    {
        return [...s].length
    }
}
