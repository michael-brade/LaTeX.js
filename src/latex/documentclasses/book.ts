import { Args, Macro } from '../../macros.ts'

import { Report } from './report.ts'


// book in LaTeX has no abstract

export class Book extends Report
{
    public static css = "css/book.css";

    // \@mainmatter in book.cls
    private _mainmatter: boolean;

    constructor(...args: ConstructorParameters<typeof Report>)
    {
        super(...args);

        this._mainmatter = true;
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    chapter(s: any, toc: any, ttl: any)
    {
        const unnumbered = s || !this._mainmatter;
        return [ this._startsection("chapter", 0, unnumbered, toc, ttl) ];
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
