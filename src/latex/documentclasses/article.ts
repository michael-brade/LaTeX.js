import { Elements } from "../../generator/generator.ts";

import { Macro } from '../../macros.ts'
import { Base } from './base.ts'


export class Article extends Base
{
    // public static property
    public static css = "css/article.css";

    constructor(...args: ConstructorParameters<typeof Base>)
    {
        super(...args);

        this.g.setCounter("secnumdepth", 3);
        this.g.setCounter("tocdepth", 3);
    }

    refname()
    {
        return [ "References" ];
    }


    // toc

    @Macro("V")
    tableofcontents()
    {
        // TODO: the table of contents itself is not implemented yet
        return [ ...this.section(true, undefined, this.g.macro("contentsname")) ];
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
        this.g.setCounter("section", 0);
        this.g.setCounter("subsection", 0);

        // dynamically overriding the 'thesection' macro (method)
        this.thesection = () => {
            return [ this.g.Alph(this.g.counter("section")) ];
        };
    }
}
