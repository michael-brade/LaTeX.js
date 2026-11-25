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


    @Macro("V")
    appendix(): void
    {
        this.g.setCounter("section", 0);
        this.g.setCounter("subsection", 0);

        // in LaTeX: \renewcommand\thesection{\@Alph\c@section}
        this.g.newcommand("thesection", () => [ this.g.Alph(this.g.counter("section")) ]);
    }
}
