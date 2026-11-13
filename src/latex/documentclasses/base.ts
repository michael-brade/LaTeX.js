import { Elements, type Generator } from "../../generator/generator.ts"
import { Args, Macro } from "../../macros.ts"
import type { PackageOpts } from "../../options.ts";
import { Length } from "../../types.ts"


export type SectionKind =
  | "part"
  | "chapter"
  | "section"
  | "subsection"
  | "subsubsection"
  | "paragraph"
  | "subparagraph";


// Base class for all standard documentclasses
export class Base
{
    public g: Generator;
    public options: PackageOpts;
    public args: Record<string, any> = {};

    private titleFn: (() => void) | null = null;
    private authorFn: (() => void) | null = null;
    private dateFn: (() => void) | null = null;
    private maketitleFn: (() => void) | null = null;

    constructor(generator: Generator, options?: PackageOpts)
    {
        this.g = generator;
        this.options = options ?? new Map();

        this.g.newCounter("part");
        this.g.newCounter("section");
        this.g.newCounter("subsection", "section");
        this.g.newCounter("subsubsection", "subsection");
        this.g.newCounter("paragraph", "subsubsection");
        this.g.newCounter("subparagraph", "paragraph");

        this.g.newCounter("figure");
        this.g.newCounter("table");

        // default: letterpaper, 10pt, onecolumn, oneside
        this.g.setLength("paperheight", new Length(this.g, 11, "in"));
        this.g.setLength("paperwidth", new Length(this.g, 8.5, "in"));
        this.g.setLength("@@size", new Length(this.g, 10, "pt"));

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
                    this.g.setLength("paperheight", new Length(this.g, 297, "mm"));
                    this.g.setLength("paperwidth", new Length(this.g, 210, "mm"));
                    break;
                case "a5paper":
                    this.g.setLength("paperheight", new Length(this.g, 210, "mm"));
                    this.g.setLength("paperwidth", new Length(this.g, 148, "mm"));
                    break;
                case "b5paper":
                    this.g.setLength("paperheight", new Length(this.g, 250, "mm"));
                    this.g.setLength("paperwidth", new Length(this.g, 176, "mm"));
                    break;
                case "letterpaper":
                    this.g.setLength("paperheight", new Length(this.g, 11, "in"));
                    this.g.setLength("paperwidth", new Length(this.g, 8.5, "in"));
                    break;
                case "legalpaper":
                    this.g.setLength("paperheight", new Length(this.g, 14, "in"));
                    this.g.setLength("paperwidth", new Length(this.g, 8.5, "in"));
                    break;
                case "executivepaper":
                    this.g.setLength("paperheight", new Length(this.g, 10.5, "in"));
                    this.g.setLength("paperwidth", new Length(this.g, 7.25, "in"));
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
                        this.g.setLength("@@size", new Length(this.g, value, "pt"));
                    }
                    break;
                }
            }
        });

        //// textwidth
        const pt345 = new Length(this.g, 345, "pt");
        const inch = new Length(this.g, 1, "in");

        let textwidth = this.g.length("paperwidth").sub(inch.mul(2));
        if (textwidth.cmp(pt345) === 1) {
            textwidth = pt345;
        }
        this.g.setLength("textwidth", textwidth);

        //// margins
        this.g.setLength("marginparsep", new Length(this.g, 11, "pt"));
        this.g.setLength("marginparpush", new Length(this.g, 5, "pt"));

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

    /**
     * \@startsection: called twice by each sectioning macro. First before its arguments are parsed
     * (toc and ttl are undefined), to step the counter and set \@currentlabel, so that a \label in the
     * title already refers to the new section; then with the arguments, to create the heading.
     *
     * @param sec the sectioning level/counter
     * @param level the numeric level, compared to secnumdepth
     * @param star true if the section should not be numbered
     * @param toc the title for the table of contents
     * @param ttl the title
     */
    protected _startsection(sec: SectionKind, level: number, star: boolean, toc?: unknown, ttl?: unknown): unknown
    {
        const numbered = !star && this.g.counter("secnumdepth") >= level;

        // call before the arguments are parsed to refstep the counter if numbered
        if (toc == null && ttl == null) {
            if (numbered) {
                this.g.stepCounter(sec);
                this.g.refCounter(sec, "sec-" + this.g.nextId());
            }
            return undefined;
        }

        if (!numbered)
            return this.g.create(Elements[sec], ttl);

        const el = this.g.create(Elements[sec], this._numberedHeading(sec, ttl));

        // the heading is the target of a \ref to this section
        this.g.setId(el, this.g.currentLabel().id);

        // entry in the TOC required?
        // if (!star && this.g.counter("tocdepth"))
        //     TODO

        return el;
    }

    // the content of a numbered heading (in LaTeX: \@seccntformat)
    protected _numberedHeading(sec: SectionKind, ttl: unknown): unknown[]
    {
        return [ ...this.g.macro("the" + sec), this.g.createText(this.g.symbol("quad")), ttl ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    part(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("part", 0, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    section(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("section", 1, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subsection(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("subsection", 2, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subsubsection(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("subsubsection", 3, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    paragraph(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("paragraph", 4, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    subparagraph(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("subparagraph", 5, s, toc, ttl) ];
    }


    thepart()           { return [ this.g.Roman(this.g.counter("part")) ];      }
    thesection()        { return [ this.g.arabic(this.g.counter("section")) ];  }
    thesubsection()     { return [ ...this.thesection(),        ".", this.g.arabic(this.g.counter("subsection")) ];    }
    thesubsubsection()  { return [ ...this.thesubsection(),     ".", this.g.arabic(this.g.counter("subsubsection")) ]; }
    theparagraph()      { return [ ...this.thesubsubsection(),  ".", this.g.arabic(this.g.counter("paragraph")) ];     }
    thesubparagraph()   { return [ ...this.theparagraph(),      ".", this.g.arabic(this.g.counter("subparagraph")) ];  }


    // title

    @Macro("V")
    maketitle()
    {
        this.g.setTitle(this.g._title);

        const title = this.g.create(Elements.title, this.g._title);
        const author = this.g.create(Elements.author, this.g._author);

        const dateVal = this.g._date ? this.g._date : this.g.macro("today");
        const date = this.g.create(Elements.date, dateVal);

        const maketitle = this.g.create(Elements.list, [
            this.g.createVSpace(new Length(this.g, 2, "em")),
            title,
            this.g.createVSpace(new Length(this.g, 1.5, "em")),
            author,
            this.g.createVSpace(new Length(this.g, 1, "em")),
            date,
            this.g.createVSpace(new Length(this.g, 1.5, "em"))
        ], "center");

        // reset footnote back to 0
        this.g.setCounter("footnote", 0);

        // reset - maketitle can only be used once
        this.g._title = null;
        this.g._author = null;
        this.g._date = null;

        // killing references so they can only run once
        this.titleFn = null;
        this.authorFn = null;
        this.dateFn = null;
        this.maketitleFn = null;

        return [ maketitle ];
    }
}
