import { Args, Macro } from '../../macros.ts'
import { Base } from './base.ts'


export class Report extends Base
{
    // public static property
    public static css = "css/book.css";

    constructor(generator: any, options?: Map<string, any>)
    {
        super(generator, options);

        this.g.newCounter("chapter");
        this.g.addToReset("section", "chapter");

        this.g.setCounter("secnumdepth", 2);
        this.g.setCounter("tocdepth", 2);

        this.g.addToReset("figure", "chapter");
        this.g.addToReset("table", "chapter");
        this.g.addToReset("footnote", "chapter");
    }

    chaptername() { return [ "Chapter" ]; }
    bibname() { return [ "Bibliography" ]; }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    part(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("part", -1, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    chapter(s: any, toc: any, ttl: any)
    {
        return [ this.g.startsection("chapter", 0, s, toc, ttl) ];
    }

    thechapter()
    {
        return [ this.g.arabic(this.g.counter("chapter")) ];
    }

    thesection()
    {
        return this.thechapter().join("") + "." + this.g.arabic(this.g.counter("section"));
    }

    thefigure()
    {
        const prefix = this.g.counter("chapter") > 0 ? [...this.thechapter(), "."] : [];
        return [ ...prefix, this.g.arabic(this.g.counter("figure")) ];
    }

    thetable()
    {
        const prefix = this.g.counter("chapter") > 0 ? [...this.thechapter(), "."] : [];
        return [ ...prefix, this.g.arabic(this.g.counter("table")) ];
    }


    // toc

    @Macro("V")
    tableofcontents()
    {
        return [ ...this.chapter(true, undefined, this.g.macro("contentsname")), this.g._toc ];
    }


    @Macro("V")
    abstract()
    {
        // onecolumn, no titlepage
        this.g.setFontSize("small");

        // TODO use center env directly instead...
        this.g.enterGroup();
        this.g.setFontWeight("bf");
        const head = this.g.create(this.g.list, this.g.macro("abstractname"), "center");
        this.g.exitGroup();

        return [ head, ...this.g.macro("quotation") ];
    }

    endabstract(): void
    {
        this.g.macro("endquotation");
    }


    @Macro("V")
    appendix(): void
    {
        this.g.setCounter("chapter", 0);
        this.g.setCounter("section", 0);

        // Dynamic string lookup / functional assignment from LiveScript @[\chaptername]
        this.chaptername = this.appendixname;

        this.thechapter = () => {
            return [ this.g.Alph(this.g.counter("chapter")) ];
        };
    }
}
