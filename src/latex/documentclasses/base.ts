import { Args, Macro } from "../../macros.ts"


// Base class for all standard documentclasses
export class Base
{
    public g: any;
    public options: Map<string, any> = new Map();
    public args: Record<string, any> = {};

    // Internal state variables referenced in LiveScript (e.g., 'if @g._date then that')
    private titleFn: (() => void) | null = null;
    private authorFn: (() => void) | null = null;
    private dateFn: (() => void) | null = null;
    private maketitleFn: (() => void) | null = null;

    constructor(generator: any, options?: Map<string, any>)
    {
        this.g = generator;
        if (options)
            this.options = options;

        this.g.newCounter("part");
        this.g.newCounter("section");
        this.g.newCounter("subsection", "section");
        this.g.newCounter("subsubsection", "subsection");
        this.g.newCounter("paragraph", "subsubsection");
        this.g.newCounter("subparagraph", "paragraph");

        this.g.newCounter("figure");
        this.g.newCounter("table");

        // default: letterpaper, 10pt, onecolumn, oneside
        this.g.setLength("paperheight", new this.g.Length(11, "in"));
        this.g.setLength("paperwidth", new this.g.Length(8.5, "in"));
        this.g.setLength("@@size", new this.g.Length(10, "pt"));

        this.options.forEach((v: any, k: string) => {
            switch (k) {
                case "oneside":
                    break;
                case "twoside": // twoside doesn't make sense in single-page HTML
                    break;
                case "onecolumn": // TODO
                    break;
                case "twocolumn":
                    break;
                case "titlepage": // TODO
                    break;
                case "notitlepage":
                    break;
                case "fleqn":
                    break;
                case "leqno":
                    break;

                case "a4paper":
                    this.g.setLength("paperheight", new this.g.Length(297, "mm"));
                    this.g.setLength("paperwidth", new this.g.Length(210, "mm"));
                    break;
                case "a5paper":
                    this.g.setLength("paperheight", new this.g.Length(210, "mm"));
                    this.g.setLength("paperwidth", new this.g.Length(148, "mm"));
                    break;
                case "b5paper":
                    this.g.setLength("paperheight", new this.g.Length(250, "mm"));
                    this.g.setLength("paperwidth", new this.g.Length(176, "mm"));
                    break;
                case "letterpaper":
                    this.g.setLength("paperheight", new this.g.Length(11, "in"));
                    this.g.setLength("paperwidth", new this.g.Length(8.5, "in"));
                    break;
                case "legalpaper":
                    this.g.setLength("paperheight", new this.g.Length(14, "in"));
                    this.g.setLength("paperwidth", new this.g.Length(8.5, "in"));
                    break;
                case "executivepaper":
                    this.g.setLength("paperheight", new this.g.Length(10.5, "in"));
                    this.g.setLength("paperwidth", new this.g.Length(7.25, "in"));
                    break;
                case "landscape": {
                    const tmp = this.g.length("paperheight");
                    this.g.setLength("paperheight", this.g.length("paperwidth"));
                    this.g.setLength("paperwidth", tmp);
                    break;
                }

                default: {
                    // check if a point size was given -> set font size
                    const value = parseFloat(k);
                    if (!isNaN(value) && k.endsWith("pt") && String(value) === k.substring(0, k.length - 2)) {
                        this.g.setLength("@@size", new this.g.Length(value, "pt"));
                    }
                    break;
                }
            }
        });

        //// textwidth
        const pt345 = new this.g.Length(345, "pt");
        const inch = new this.g.Length(1, "in");

        let textwidth = this.g.length("paperwidth").sub(inch.mul(2));
        if (textwidth.cmp(pt345) === 1) {
            textwidth = pt345;
        }
        this.g.setLength("textwidth", textwidth);

        //// margins
        this.g.setLength("marginparsep", new this.g.Length(11, "pt"));
        this.g.setLength("marginparpush", new this.g.Length(5, "pt"));

        // in px
        const margins = this.g.length("paperwidth").sub(this.g.length("textwidth"));
        const oddsidemargin = margins.mul(0.5).sub(inch);
        let marginparwidth = margins.mul(0.5).sub(this.g.length("marginparsep")).sub(inch.mul(0.8));
        if (marginparwidth.cmp(inch.mul(2)) === 1) {
            marginparwidth = inch.mul(2);
        }

        this.g.setLength("oddsidemargin", oddsidemargin);
        this.g.setLength("marginparwidth", marginparwidth);

        // \evensidemargin = \paperwidth - 2in - \textwidth - \oddsidemargin
        // \@settopoint\evensidemargin
    }

    contentsname() { return [ "Contents" ]; }
    listfigurename() { return [ "List of Figures" ]; }
    listtablename() { return [ "List of Tables" ]; }

    partname() { return [ "Part" ]; }

    figurename() { return [ "Figure" ]; }
    tablename() { return [ "Table" ]; }

    appendixname() { return [ "Appendix" ]; }
    indexname() { return [ "Index" ]; }


    ////////////////
    // sectioning //
    ////////////////

    @Macro("V")
    @Args("s", "X", "o?", "g")
    part(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("part", 0, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    section(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("section", 1, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subsection(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("subsection", 2, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subsubsection(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("subsubsection", 3, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    paragraph(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("paragraph", 4, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subparagraph(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("subparagraph", 5, s, toc, ttl) ];
    }


    thepart()           { return [ this.g.Roman(this.g.counter("part")) ];      }
    thesection()        { return [ this.g.arabic(this.g.counter("section")) ];  }
    thesubsection()     { return this.thesection().join("") + "." + this.g.arabic(this.g.counter("subsection"));}
    thesubsubsection()  { return this.thesubsection() + "." + this.g.arabic(this.g.counter("subsubsection"));   }
    theparagraph()      { return this.thesubsubsection() + "." + this.g.arabic(this.g.counter("paragraph"));    }
    thesubparagraph()   { return this.theparagraph() + "." + this.g.arabic(this.g.counter("subparagraph"));     }


    // title

    @Macro("V")
    maketitle()
    {
        this.g.setTitle(this.g._title);

        const title = this.g.create(this.g.title, this.g._title);
        const author = this.g.create(this.g.author, this.g._author);

        // LiveScript 'if @g._date then that else ...' translation
        const dateVal = this.g._date ? this.g._date : this.g.macro("today");
        const date = this.g.create(this.g.date, dateVal);

        const maketitle = this.g.create(this.g.list, [
            this.g.createVSpace(new this.g.Length(2, "em")),
            title,
            this.g.createVSpace(new this.g.Length(1.5, "em")),
            author,
            this.g.createVSpace(new this.g.Length(1, "em")),
            date,
            this.g.createVSpace(new this.g.Length(1.5, "em"))
        ], "center");

        // reset footnote back to 0
        this.g.setCounter("footnote", 0);

        // reset - maketitle can only be used once
        this.g._title = null;
        this.g._author = null;
        this.g._date = null;

        // Killing references so they can only run once (!-> in LiveScript)
        this.titleFn = null;
        this.authorFn = null;
        this.dateFn = null;
        this.maketitleFn = null;

        return [ maketitle ];
    }
}
