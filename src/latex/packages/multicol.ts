import type { Generator } from '../../generator/generator.ts';
import { Macro, Args } from '../../macros.ts';
import type { PackageOpts } from "../../options.ts";


export class Multicol
{
    public g: Generator;

    constructor(generator: Generator, options?: PackageOpts)
    {
        this.g = generator;
    }

    @Macro('V')
    @Args('n', 'o?', 'o?')
    public multicols(cols: number, pre?: any): any[]
    {
        return [pre, this.g.createMulticols(cols)];
    }
}
