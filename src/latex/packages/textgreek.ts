import { decode } from 'he';

import type { Generator } from '../../generator/generator.ts';
import type { PackageOpts } from "../../options.ts";


export class Textgreek
{
    constructor(generator: Generator, options?: PackageOpts)
    {
    }


    public static symbols: Map<string, string> = new Map([
        // greek letters - lower case
        ["textalpha", decode('&alpha;')],       // α     U+03B1
        ["textbeta", decode('&beta;')],         // β     U+03B2
        ["textgamma", decode('&gamma;')],       // γ     U+03B3
        ["textdelta", decode('&delta;')],       // δ     U+03B4
        ["textepsilon", decode('&epsilon;')],   // ε     U+03B5
        ["textzeta", decode('&zeta;')],         // ζ     U+03B6
        ["texteta", decode('&eta;')],           // η     U+03B7
        ["texttheta", decode('&thetasym;')],    // ϑ     U+03D1  (θ = U+03B8)
        ["textiota", decode('&iota;')],         // ι     U+03B9
        ["textkappa", decode('&kappa;')],       // κ     U+03BA
        ["textlambda", decode('&lambda;')],     // λ     U+03BB
        ["textmu", decode('&mu;')],             // μ     U+03BC  this is better than \u00B5, LaTeX's original
        ["textmugreek", decode('&mu;')],
        ["textnu", decode('&nu;')],             // ν     U+03BD
        ["textxi", decode('&xi;')],             // ξ     U+03BE
        ["textomikron", decode('&omicron;')],   // ο     U+03BF
        ["textpi", decode('&pi;')],             // π     U+03C0
        ["textrho", decode('&rho;')],           // ρ     U+03C1
        ["textsigma", decode('&sigma;')],       // σ     U+03C3
        ["texttau", decode('&tau;')],           // τ     U+03C4
        ["textupsilon", decode('&upsilon;')],   // υ     U+03C5
        ["textphi", decode('&phi;')],           // φ     U+03C6
        ["textchi", decode('&chi;')],           // χ     U+03C7
        ["textpsi", decode('&psi;')],           // ψ     U+03C8
        ["textomega", decode('&omega;')],       // ω     U+03C9

        // greek letters - upper case
        ["textAlpha", decode('&Alpha;')],       // Α     U+0391
        ["textBeta", decode('&Beta;')],         // Β     U+0392
        ["textGamma", decode('&Gamma;')],       // Γ     U+0393
        ["textDelta", decode('&Delta;')],       // Δ     U+0394
        ["textEpsilon", decode('&Epsilon;')],   // Ε     U+0395
        ["textZeta", decode('&Zeta;')],         // Ζ     U+0396
        ["textTarget", decode('&Eta;')],        // Η     U+0397
        ["textTheta", decode('&Theta;')],       // Θ     U+0398
        ["textIota", decode('&Iota;')],         // Ι     U+0399
        ["textKappa", decode('&Kappa;')],       // Κ     U+039A
        ["textLambda", decode('&Lambda;')],     // Λ     U+039B
        ["textMu", decode('&Mu;')],             // Μ     U+039C
        ["textNu", decode('&Nu;')],             // Ν     U+039D
        ["textXi", decode('&Xi;')],             // Ξ     U+039E
        ["textOmikron", decode('&Omicron;')],   // Ο     U+039F
        ["textPi", decode('&Pi;')],             // Π     U+03A0
        ["textRho", decode('&Rho;')],           // Ρ     U+03A1
        ["textSigma", decode('&Sigma;')],       // Σ     U+03A3
        ["textTau", decode('&Tau;')],           // Τ     U+03A4
        ["textUpsilon", decode('&Upsilon;')],   // Υ     U+03A5
        ["textPhi", decode('&Phi;')],           // Φ     U+03A6
        ["textChi", decode('&Chi;')],           // Χ     U+03A7
        ["textPsi", decode('&Psi;')],           // Ψ     U+03A8
        ["textOmega", decode('&Omega;')],       // Ω     U+03A9

        // variants
        ["textvarsigma", decode('&sigmaf;')],   // ς     U+03C2
        ["straightphi", "\u03D5"],              // ϕ
        ["scripttheta", "\u03D1"],              // ϑ
        ["straighttheta", decode('&theta;')],   // θ     U+03B8
        ["straightepsilon", "\u03F5"]           // ϵ
    ]);
}
