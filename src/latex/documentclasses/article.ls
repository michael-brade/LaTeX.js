import { Macro } from '../../macros.ts'
import { Base } from './base.ts'


export class Article extends Base
{
    // public static property
    public static css = "css/article.css";

    constructor(generator: any, options?: Map<string, any>)
    {
        super(generator, options);

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
        // In LiveScript '++' concatenates arrays.
        return [ ...this.section(true, undefined, this.g.macro("contentsname")), this.g._toc ];
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

    // !-> signifies void return (no return)
    endabstract(): void
    {
        this.g.macro("endquotation");
    }


    @Macro("V")
    appendix(): void
    {
        this.g.setCounter("section", 0);
        this.g.setCounter("subsection", 0);

        // Dynamically overriding the 'thesection' method instance assignment
        this.thesection = () => {
            return [ this.g.Alph(this.g.counter("section")) ];
        };
    }
}
