import { type Constructor } from "../../lib/mixin.ts"

import { Generator } from "./generator.ts"


export function Counters<TGenerator extends Constructor<Generator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the Generator(s) and handles the global LaTeX counter state and manipulation.
     */
    abstract class CountersMixin extends GeneratorBase
    {
        _counters: Map<string, number> = new Map();
        _resets: Map<string, string[]> = new Map();

        // part of global generator reset
        override reset()
        {
            super.reset()

            this._counters.clear()
            this._resets.clear()
        }


        newCounter(c: string, parent?: string): void
        {
            if (this.hasCounter(c))
                this.error(`counter ${c} already defined!`);

            this._counters.set(c, 0);
            this._resets.set(c, []);

            if (parent)
                this.addToReset(c, parent);

            if (this.hasMacro("the" + c))
                this.error(`macro \\the${c} already defined!`);

            // defines new macro \the+c to print the current value of counter "c", formatted
            this.newcommand("the" + c, () => [this.arabic(this.counter(c))]);
        }


        hasCounter(c: string): boolean
        {
            return this._counters.has(c);
        }


        counter(c: string): number
        {
            if (!this.hasCounter(c))
                this.error(`no such counter: ${c}`);

            return this._counters.get(c)!;
        }


        setCounter(c: string, v: number): void
        {
            if (!this.hasCounter(c))
                this.error(`no such counter: ${c}`);

            this._counters.set(c, v);
        }


        stepCounter(c: string): void
        {
            this.setCounter(c, this.counter(c) + 1);
            this._clearCounter(c);
        }


        addToReset(c: string, parent: string): void
        {
            if (!this.hasCounter(parent))
                this.error(`no such counter: ${parent}`);

            if (!this.hasCounter(c))
                this.error(`no such counter: ${c}`);

            this._resets.get(parent)!.push(c);
        }


        // reset all descendants of c to 0
        _clearCounter(c: string): void
        {
            // clearCounter only called after setCounter, so _resets is never undefined for it
            for (const r of this._resets.get(c)!) {
                this._clearCounter(r);
                this.setCounter(r, 0);
            }
        }


        //// formatting counters

        alph(num: number): string
        {
            return String.fromCharCode(96 + num);
        }

        Alph(num: number): string
        {
            return String.fromCharCode(64 + num);
        }

        arabic(num: number): string
        {
            return String(num);
        }

        roman(num: number): string
        {
            const lookup: [string, number][] = [
                ['m',  1000],
                ['cm', 900],
                ['d',  500],
                ['cd', 400],
                ['c',  100],
                ['xc', 90],
                ['l',  50],
                ['xl', 40],
                ['x',  10],
                ['ix', 9],
                ['v',  5],
                ['iv', 4],
                ['i',  1]
            ];

            return this._roman(num, lookup);
        }

        Roman(num: number): string
        {
            const lookup: [string, number][] = [
                ['M',  1000],
                ['CM', 900],
                ['D',  500],
                ['CD', 400],
                ['C',  100],
                ['XC', 90],
                ['L',  50],
                ['XL', 40],
                ['X',  10],
                ['IX', 9],
                ['V',  5],
                ['IV', 4],
                ['I',  1]
            ];

            return this._roman(num, lookup);
        }

        _roman(num: number, lookup: [string, number][]): string
        {
            let romanStr = "";

            for (const i of lookup) {
                while (num >= i[1]) {
                    romanStr += i[0];
                    num -= i[1];
                }
            }

            return romanStr;
        }

        fnsymbol(num: number): string[]
        {
            switch (num) {
                case 1:  return this.macro('textasteriskcentered');
                case 2:  return this.macro('textdagger');
                case 3:  return this.macro('textdaggerdbl');
                case 4:  return this.macro('textsection');
                case 5:  return this.macro('textparagraph');
                case 6:  return this.macro('textbardbl');
                case 7:  return this._doubleSymbol('textasteriskcentered');
                case 8:  return this._doubleSymbol('textdagger');
                case 9:  return this._doubleSymbol('textdaggerdbl');
                default: this.error("fnsymbol value must be between 1 and 9");
            }
        }

        _doubleSymbol(name: string): string[] {
            return this.macro(name).concat(this.macro(name));
        }
    }

    return CountersMixin
}