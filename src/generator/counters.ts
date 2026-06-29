
type Constructor = new (...args: any[]) => {};


function Scale<TBase extends Constructor>(Base: TBase) {
  return class Scaling extends Base {
    // Mixins may not declare private/protected properties
    // however, you can use ES2020 private fields
    #scale = 1;

    setScale(scale: number) {
      this.#scale = scale;
    }

    get scale(): number {
      return this.#scale;
    }
  };
}

/**
 * This class is part of the Generator(s) and handles the global LaTeX counter state and manipulation.
 */
// TODO throws exceptions, handle them
export class Counters
{
    #counters: Map<string, number> = new Map();
    #resets: Map<string, string[]> = new Map();


    // TODO how to access Generator??
    _macros: Record<string, () => any[]> = {};
    g = { arabic: (val: number) => {} };
    hasMacro(name: string): boolean { return false; }
    // TODO end


    // part of global generator reset
    reset()
    {
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

        // TODO how to access Generator?? or move this?
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
