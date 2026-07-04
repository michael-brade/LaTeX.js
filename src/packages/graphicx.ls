import type { Generator } from "../generator/generator.ts";
import { Macro, Args } from '../macros.ts';


export class Graphicx
{
    public g: any;

    constructor(generator: Generator, options?: any)
    {
        this.g = generator;
    }

    // 3 Colour   TODO: also in xcolor - include xcolor instead?


    // 4.2 Rotation

    // \rotatebox[key-val list]{angle}{text}
    @Macro('H')
    @Args('kv?', 'n', 'hg')
    public rotatebox(kvl?: Map<string, any>, angle?: number, text?: string): void
    {
        // origin=one or two of: lrctbB
        // x=<dimen>
        // y=<dimen>
        // units=<number>
    }


    // 4.3 Scaling

    // TODO: check if they all need to be hg instead of g?

    // \scalebox{h-scale}[v-scale]{text}
    @Macro('H')
    @Args('n', 'n?', 'g')
    public scalebox(hsc: number, vsc?: number, text?: string): any
    {
        // style="transform: scale(hsc, vsc);"
    }


    // \reflectbox{text}
    @Macro('H')
    @Args('g')
    public reflectbox(text: string): any
    {
        return this.scalebox(-1, 1, text);
    }


    // \resizebox*{h-length}{v-length}{text}
    @Macro('H')
    @Args('s', 'l', 'l', 'g')
    public resizebox(s: boolean, hl: any, vl: any, text: string): void
    {
        // Implementation
    }


    // 4.4 Including Graphics Files

    // TODO: restrict to just one path?
    // { {path1/} {path2/} }
    @Macro('HV')
    @Args('gl')
    public graphicspath(paths: string[]): void
    {
        // Implementation
    }


    // graphics: \includegraphics*[<llx,lly>][<urx,ury>]{<file>}     TODO
    // graphicx: \includegraphics*[<key-val list>]{<file>}

    @Macro('H')
    @Args('s', 'kv?', 'kv?', 'k')
    public includegraphics(s: boolean, kvl: Map<string, any> | undefined, kvl2: Map<string, any> | undefined, file: string): any[]
    {
        // LaTeX supports the following keys:
        //
        // set bounding box:
        //  * bb = a b c d
        //  * bbllx=a, bblly=b, bburx=c, bbury=d => equivalent to bb=a b c d
        //  * natwidth=w, natheight=h => equivalent to bb=0 0 h w
        //
        // hiresbb, pagebox
        //
        // viewport
        // trim
        //
        // angle, origin (for rotation)
        //
        // width, height
        // totalheight
        //
        // scale
        //
        // clip
        // draft
        //
        // type, ext, read, command
        //
        // quiet
        // page (when including a pdf)
        // interpolate

        // order of the keys is important! insert into map in order!

        // Safely check for properties if kvl is provided via null-safe calls (.get)
        const width = kvl?.get("width");
        const height = kvl?.get("height");

        return [ this.g.createImage(width, height, file) ];
    }
}
