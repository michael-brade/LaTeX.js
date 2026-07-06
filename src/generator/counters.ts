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
        reset()
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

            // defines new macro \the+c
            this._macros["the" + c] = () => [this.g.arabic(this.counter(c))];
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
    }

    return CountersMixin
}