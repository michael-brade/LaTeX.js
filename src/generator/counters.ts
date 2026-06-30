import { Generator } from "../generator.ts"
import { type Constructor } from "../../lib/mixin.ts"


export function Counters<TGenerator extends Constructor<Generator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the Generator(s) and handles the global LaTeX counter state and manipulation.
     */
    // TODO throws exceptions, handle them - or add error() to Generator base
    abstract class CountersMixin extends GeneratorBase
    {
        #counters: Map<string, number> = new Map();
        #resets: Map<string, string[]> = new Map();

        // part of global generator reset
        reset()
        {
            super.reset()

            this.#counters.clear()
            this.#resets.clear()
        }


        newCounter(c: string, parent?: string): void
        {
            if (this.hasCounter(c))
                throw new Error(`counter ${c} already defined!`);

            this.#counters.set(c, 0);
            this.#resets.set(c, []);

            if (parent)
                this.addToReset(c, parent);

            if (this.hasMacro("the" + c))
                throw new Error(`macro \\the${c} already defined!`);

            this._macros["the" + c] = () => [this.g.arabic(this.counter(c))];
        }


        hasCounter(c: string): boolean
        {
            return this.#counters.has(c);
        }


        counter(c: string): number
        {
            if (!this.hasCounter(c))
                throw new Error(`no such counter: ${c}`);

            return this.#counters.get(c)!;
        }


        setCounter(c: string, v: number): void
        {
            if (!this.hasCounter(c))
                throw new Error(`no such counter: ${c}`);

            this.#counters.set(c, v);
        }


        stepCounter(c: string): void
        {
            this.setCounter(c, this.counter(c) + 1);
            this.#clearCounter(c);
        }


        addToReset(c: string, parent: string): void
        {
            if (!this.hasCounter(parent))
                throw new Error(`no such counter: ${parent}`);

            if (!this.hasCounter(c))
                throw new Error(`no such counter: ${c}`);

            this.#resets.get(parent)!.push(c);
        }


        // reset all descendants of c to 0
        #clearCounter(c: string): void
        {
            // clearCounter only called after setCounter, so #resets is never undefined for it
            for (const r of this.#resets.get(c)!) {
                this.#clearCounter(r);
                this.setCounter(r, 0);
            }
        }
    }

    return CountersMixin
}