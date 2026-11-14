
import type { Generator } from '../../generator/generator.ts';
import type { PackageOpts } from "../../options.ts";


export class Textgreek
{
    constructor(generator: Generator, options?: PackageOpts)
    {
    }


    public static symbols: Map<string, string> = new Map([
        // greek letters - lower case
        ["textalpha",               "\u03B1"],    // α
        ["textbeta",                "\u03B2"],    // β
        ["textgamma",               "\u03B3"],    // γ
        ["textdelta",               "\u03B4"],    // δ
        ["textepsilon",             "\u03B5"],    // ε
        ["textzeta",                "\u03B6"],    // ζ
        ["texteta",                 "\u03B7"],    // η
        ["texttheta",               "\u03D1"],    // ϑ   (θ = U+03B8)
        ["textiota",                "\u03B9"],    // ι
        ["textkappa",               "\u03BA"],    // κ
        ["textlambda",              "\u03BB"],    // λ
        ["textmu",                  "\u03BC"],    // μ   this is better than \u00B5, LaTeX's original
        ["textmugreek",             "\u03BC"],    // μ
        ["textnu",                  "\u03BD"],    // ν
        ["textxi",                  "\u03BE"],    // ξ
        ["textomikron",             "\u03BF"],    // ο
        ["textpi",                  "\u03C0"],    // π
        ["textrho",                 "\u03C1"],    // ρ
        ["textsigma",               "\u03C3"],    // σ
        ["texttau",                 "\u03C4"],    // τ
        ["textupsilon",             "\u03C5"],    // υ
        ["textphi",                 "\u03C6"],    // φ
        ["textchi",                 "\u03C7"],    // χ
        ["textpsi",                 "\u03C8"],    // ψ
        ["textomega",               "\u03C9"],    // ω

        // greek letters - upper case
        ["textAlpha",               "\u0391"],    // Α
        ["textBeta",                "\u0392"],    // Β
        ["textGamma",               "\u0393"],    // Γ
        ["textDelta",               "\u0394"],    // Δ
        ["textEpsilon",             "\u0395"],    // Ε
        ["textZeta",                "\u0396"],    // Ζ
        ["textEta",                 "\u0397"],    // Η
        ["textTheta",               "\u0398"],    // Θ
        ["textIota",                "\u0399"],    // Ι
        ["textKappa",               "\u039A"],    // Κ
        ["textLambda",              "\u039B"],    // Λ
        ["textMu",                  "\u039C"],    // Μ
        ["textNu",                  "\u039D"],    // Ν
        ["textXi",                  "\u039E"],    // Ξ
        ["textOmikron",             "\u039F"],    // Ο
        ["textPi",                  "\u03A0"],    // Π
        ["textRho",                 "\u03A1"],    // Ρ
        ["textSigma",               "\u03A3"],    // Σ
        ["textTau",                 "\u03A4"],    // Τ
        ["textUpsilon",             "\u03A5"],    // Υ
        ["textPhi",                 "\u03A6"],    // Φ
        ["textChi",                 "\u03A7"],    // Χ
        ["textPsi",                 "\u03A8"],    // Ψ
        ["textOmega",               "\u03A9"],    // Ω

        // variants
        ["textvarsigma",            "\u03C2"],    // ς
        ["straightphi",             "\u03D5"],    // ϕ
        ["scripttheta",             "\u03D1"],    // ϑ
        ["straighttheta",           "\u03B8"],    // θ
        ["straightepsilon",         "\u03F5"]     // ϵ
    ]);
}
