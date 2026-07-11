import type { Generator } from '../../generator/generator.ts';
import { Macro, Args } from '../../macros.ts';
import type { PackageOpts } from "../../options.ts";


export class Hyperref
{
    public g: any;

    constructor(generator: Generator, options?: PackageOpts)
    {
        this.g = generator;
    }

    @Macro('H')
    @Args('o?', 'u', 'g')
    public href(opts: any, url: string, txt: string): any[]
    {
        return [this.g.create(this.g.link(url)), txt];
    }

    @Macro('H')
    @Args('u')
    public url(url: string): any[]
    {
        return [this.g.create(this.g.link(url)), this.g.createText(url)];
    }

    @Macro('H')
    @Args('u')
    public nolinkurl(url: string): any[]
    {
        return [this.g.create(this.g.link()), this.g.createText(url)];
    }

    // TODO
    // \hyperbaseurl  HV u

    // \hyperref[label]{link text} --- like \ref{label}, but use "link text" for display
    // @Macro('H')
    // @Args('o?', 'g')
    // public hyperref(label: any, txt: string): any[] {
    //     return [this.g.ref(label)];
    // }
}
