import type { Generator } from '../../generator/generator.ts';
import { Macro, Args } from '../../macros.ts';
import type { PackageOpts } from "../../options.ts";


// macros just for testing
export class Echo
{
    constructor(generator: Generator, options?: PackageOpts)
    {
    }

    @Macro('H')
    @Args('o?')
    public gobbleO(): any[]
    {
        return [];
    }

    @Macro('H')
    @Args('o?')
    public echoO(o?: string): string[]
    {
        return ["-", o ?? "", "-"];     // TODO: why ??
    }

    @Macro('H')
    @Args('o?', 'g', 'o?')
    public echoOGO(o1?: string, g?: string, o2?: string): string[]
    {
        const result: string[] = [];

        if (o1)
            result.push("-", o1, "-");

        // g is a mandatory group, so it always evaluates
        result.push("+", g ?? "", "+");

        if (o2)
            result.push("-", o2, "-");

        return result;
    }

    @Macro('H')
    @Args('g', 'o?', 'g')
    public echoGOG(g1: string, o?: string, g2?: string): string[]
    {
        const result: string[] = ["+", g1, "+"];

        if (o)
            result.push("-", o, "-");

        result.push("+", g2 ?? "", "+");

        return result;
    }
}
