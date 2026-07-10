import type { Generator } from '../generator/generator.ts';
import { Macro, Args } from '../macros.ts';


export class Multicol
{
    public g: any;

    constructor(generator: Generator, options?: any)
    {
        this.g = generator;
    }

    @Macro('V')
    @Args('n', 'o?', 'o?')
    public multicols(cols: number, pre?: any): any[]
    {
        return [pre, this.g.create(this.g.multicols(cols))];
    }
}
