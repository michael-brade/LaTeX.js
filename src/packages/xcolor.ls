import { Macro, Args } from '../macros.ts';

// color data structure:

// color-name: {
//     rgb: { r: , g: , b: },
//     hsb: { },
//     cmyk: {},
//     gray:
// }

export interface ColorData
{
    rgb?: { r: number; g: number; b: number };
    hsb?: Record<string, any>;
    cmyk?: Record<string, any>;
    gray?: number;
    [key: string]: any;
}

export interface SpecItem
{
    name: string;
    speclist: any[];
}

export interface ColorModels
{
    models: string[];
    core?: any;
}

export class XColor
{
    public g: any;
    public options: Record<string, any>[] = [];

    // Instance color database
    public colors: Map<string, ColorData> = new Map([
        ["red", {}],
        ["green", {}],
        ["blue", {}],
        ["cyan", {}],
        ["magenta", {}],
        ["yellow", {}],
        ["black", {}],
        ["gray", {}],
        ["white", {}],
        ["darkgray", {}],
        ["lightgray", {}],
        ["brown", {}],
        ["lime", {}],
        ["olive", {}],
        ["orange", {}],
        ["pink", {}],
        ["purple", {}],
        ["teal", {}],
        ["violet", {}]
    ]);

    // CTOR
    constructor(generator: any, options?: Record<string, any>[])
    {
        this.g = generator;
        if (options)
            this.options = options;

        for (const optObj of this.options) {
            const opt = Object.keys(optObj)[0];

            // xcolor, 2.1.2
            switch (opt) {
                // target color mode
                case "natural":
                case "rgb":
                case "cmy":
                case "cmyk":
                case "hsb":
                case "gray":
                case "RGB":
                case "HTML":
                case "HSB":
                case "Gray":
                case "monochrome":
                    break;

                // predefined colors
                case "dvipsnames":
                case "dvipsnames*":
                case "svgnames":
                case "svgnames*":
                case "x11names":
                case "x11names*":
                    break;

                default:
                    break;
            }
        }
    }

    // defining colors

    // \definecolorset[type]{model-list}{head}{tail}{set spec}
    @Macro('P')
    @Args('i?', 'c-ml', 'ie', 'ie', 'c-ssp')
    public definecolorset(type: string | null, models: ColorModels, hd: string | null, tl: string | null, setspec: SpecItem[]): void
    {
        if (type !== null && type !== "named" && type !== "ps")
            this.g.error("unknown color type");

        const head = hd ?? "";
        const tail = tl ?? "";

        for (const spec of setspec)
            this.definecolor(type, head + spec.name + tail, models, spec.speclist);
    }

    // \definecolor[type]{name}{model-list}{color spec list}
    @Macro('P')
    @Args('i?', 'i', 'c-ml', 'c-spl')
    public definecolor(type: string | null, name: string, models: ColorModels, colorspec: any[]): void
    {
        if (type !== null && type !== "named" && type !== "ps")
            this.g.error("unknown color type");

        if (models.models.length !== colorspec.length)
            this.g.error("color models and specs don't match");

        const color: ColorData = {};

        // TODO: deal with models.core

        for (let i = 0; i < models.models.length; i++) {
            const model = models.models[i];
            color[model] = colorspec[i];
        }

        this.colors.set(name, color);
    }

    // using colors

    // {name/expression} or [model-list]{color spec list}
    @Macro('HV')
    @Args([["c-ml?", "c-spl"], ["c"]])
    public color(...args: any[]): void
    {
        if (args.length === 1)
            console.log("got color expression");
        else
            console.log("got model/color spec");
    }

    // args.\color =       <[ HV c-ml? c-spl ]>
    // \color      : (model, colorspec) ->

    // {name/expression}{text} or [model-list]{color spec list}{text}
    @Macro('HV')
    @Args([["c-ml?", "c-spl"], ["c"]], "g")
    public textcolor(...args: any[]): void
    {
        if (args.length === 2)
            return;

        return;
    }

    // \colorbox{name}{text}
    // \colorbox[model]{specification}{text}
    @Macro('H')
    @Args('i?', 'c', 'g')
    public colorbox(model: string, color: any, text: string): void
    {
        // Implementation
    }

    // \fcolorbox{name1}{name2}{text}
    // \fcolorbox[model]{specification1}{specification2}{text}
    @Macro('H')
    @Args('i?', 'c', 'c', 'g')
    public fcolorbox(model: string, color: any, text: string): void
    {
        // Implementation
    }
}
