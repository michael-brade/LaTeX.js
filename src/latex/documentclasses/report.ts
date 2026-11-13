import { Args, Macro } from '../../macros.ts'
import { Elements } from "../../generator/generator.ts";

import { Base, type SectionKind } from './base.ts'


export class Report extends Base
{
    public static css = "css/book.css";

    constructor(...args: ConstructorParameters<typeof Base>)
    {
        super(...args);

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
        return [ this._startsection("part", -1, s, toc, ttl) ];
    }

    @Macro("V")
    @Args("s", "X", "o?", "g")
    chapter(s: any, toc: any, ttl: any)
    {
        return [ this._startsection("chapter", 0, s, toc, ttl) ];
    }

    // a numbered chapter heading starts with "Chapter n" on its own line (in LaTeX: \@makechapterhead)
    protected override _numberedHeading(sec: SectionKind, ttl: unknown): unknown[]
    {
        if (sec !== "chapter")
            return super._numberedHeading(sec, ttl);

        const chaphead = this.g.create(Elements.block, [
            ...this.g.macro("chaptername"),
            this.g.createText(this.g.symbol("space")),
            ...this.g.macro("thechapter")
        ]);

        return [ chaphead, ttl ];
    }

    thechapter()
    {
        return [ this.g.arabic(this.g.counter("chapter")) ];
    }

    thesection()
    {
        return [ ...this.thechapter(), ".", this.g.arabic(this.g.counter("section")) ];
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
        // TODO: the table of contents itself is not implemented yet
        return [ ...this.chapter(true, undefined, this.g.macro("contentsname")) ];
    }


    @Macro("V")
    abstract()
    {
        // onecolumn, no titlepage
        this.g.setFontSize("small");

        // TODO use center env directly instead...
        this.g.enterGroup();
        this.g.setFontWeight("bf");
        const head = this.g.create(Elements.list, this.g.macro("abstractname"), "center");
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

        // chaptername macro is now appendixname
        this.chaptername = this.appendixname;

        this.thechapter = () => {
            return [ this.g.Alph(this.g.counter("chapter")) ];
        };
    }
}
