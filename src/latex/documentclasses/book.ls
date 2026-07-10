import { Args, Macro } from '../../macros.ts'
import { Report } from './report.ts'


export class Book extends Report
{
    // public static property
    public static css = "css/book.css";

    // Internal instance flag mapping to @"@mainmatter"
    private _mainmatter: boolean;

    constructor(generator: any, options?: Map<string, any>) {
        super(generator, options);

        this._mainmatter = true;
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    chapter(s: any, toc: any, ttl: any)
    {
        // s or not @"@mainmatter"
        const condition = s || !this._mainmatter;
        return [ this.g.startsection("chapter", 0, condition, toc, ttl) ];
    }

    @Macro("V")
    frontmatter(): void
    {
        this._mainmatter = false;
    }

    @Macro("V")
    mainmatter(): void
    {
        this._mainmatter = true;
    }

    @Macro("V")
    backmatter(): void
    {
        this._mainmatter = false;
    }
}
