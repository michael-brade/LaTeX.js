import { type Constructor } from "../../lib/mixin.ts"

import { Generator } from "./generator.ts"
import type { TextAttributes } from "./attributes.ts"
import { ligatures, diacritics, symbols } from "../latex/symbols.ts"


/**
 * Type part that the Primitives mixin needs from its base: the Generator core plus the
 * active text attributes (Attributes mixin)
 */
type AttributedGenerator = Generator & {
    _activeAttributeValue(attr: keyof TextAttributes): string | undefined
}


export function Primitives<TGenerator extends Constructor<AttributedGenerator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the generator and translates the LaTeX primitives (characters, spaces,
     * quotes, hyphens, ligatures, diacritics, control symbols, symbols) to Unicode strings.
     *
     * This is format-independent: the strings are turned into output nodes only by createText().
     * A generator needing a different mapping (e.g. ASCII only) can just override the respective method.
     */
    abstract class PrimitivesMixin extends GeneratorBase
    {
        //// spaces and invisible characters

        readonly sp     = ' '               // collapsible space
        readonly brsp   = '\u200B '         // U+200B + ' ': breakable but non-collapsible space
        readonly nbsp   = '\u00A0'          // non-breaking space
        readonly visp   = '\u2423'          // visible space (\verb*)
        readonly zwnj   = '\u200C'          // zero width non-joiner: prevents ligatures
        readonly shy    = '\u00AD'          // soft hyphen: word break/hyphenation marker
        readonly thinsp = '\u2009'          // thin space


        //// characters

        character(c: string): string
        {
            return c;
        }

        textquote(q: string): string | undefined
        {
            switch (q) {
                case '`':
                    return this.symbol('textquoteleft');
                case '\'':
                    return this.symbol('textquoteright');
                default:
                    return undefined;
            }
        }

        hyphen(): string
        {
            // no typographic hyphen in tt
            if (this._activeAttributeValue('fontFamily') === 'tt')
                return '-';                 // U+002D

            return '\u2010';           // U+2010 hyphen
        }

        ligature(l: string): string
        {
            // no ligatures in tt
            if (this._activeAttributeValue('fontFamily') === 'tt')
                return l;

            return ligatures.get(l) ?? l;
        }


        //// diacritics

        hasDiacritic(d: string): boolean
        {
            return diacritics.has(d);
        }

        // diacritic d for char c; if only d is given, return the standalone version
        diacritic(d: string, c?: string): string
        {
            const dia = diacritics.get(d);
            if (!dia)
                this.error(`no such diacritic: ${d}`);

            const [combining, standalone] = dia as [string, string];
            return c ? c + combining : standalone;
        }


        //// control symbols and symbols

        controlSymbol(c: string): string
        {
            switch (c) {
                case '/':
                    return this.zwnj;
                case ',':
                    return this.thinsp;
                case '-':
                    return this.shy;
                case '@':
                    return '\u200B';  // nothing, just prevent spaces from collapsing
                default:
                    return this.character(c);
            }
        }

        hasSymbol(name: string): boolean
        {
            return symbols.has(name);
        }

        symbol(name: string): string
        {
            if (!this.hasSymbol(name))
                this.error(`no such symbol: ${name}`);

            return symbols.get(name)!;
        }
    }

    return PrimitivesMixin
}
