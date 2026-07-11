import { LaTeX } from './latex.ltx.ts'

import { Article } from './documentclasses/article.ts'
import { Book } from './documentclasses/book.ts'
import { Report } from './documentclasses/report.ts'

import { Color } from './packages/color.ts'
import { XColor } from './packages/xcolor.ts'
import { Echo } from './packages/echo.ts'
import { Gensymb } from './packages/gensymb.ts'
import { Graphics } from './packages/graphics.ts'
import { Graphicx } from './packages/graphicx.ts'
import { Hyperref } from './packages/hyperref.ts'
import { Latexsym } from './packages/latexsym.ts'
import { Multicol } from './packages/multicol.ts'
import { Stix } from './packages/stix.ts'
import { Textcomp } from './packages/textcomp.ts'
import { Textgreek } from './packages/textgreek.ts'


export default {
    "latex.ltx": LaTeX,

    documentclasses: {
        article: Article,
        book: Book,
        report: Report
    },

    packages: {
        color: Color,
        xcolor: XColor,
        echo: Echo,
        gensymb: Gensymb,
        graphics: Graphics,
        graphicx: Graphicx,
        hyperref: Hyperref,
        latexsym: Latexsym,
        multicol: Multicol,
        stix: Stix,
        textcomp: Textcomp,
        textgreek: Textgreek
    }
}