'use strict'

import 'he'

export class Textgreek

    args = @args = {}

    # CTOR
    (generator, options) ->


    symbols = @symbols = new Map([
        # greek letters - lower case
        * \textalpha            he.decode '&alpha;'     # α     U+03B1
        * \textbeta             he.decode '&beta;'      # β     U+03B2
        * \textgamma            he.decode '&gamma;'     # γ     U+03B3
        * \textdelta            he.decode '&delta;'     # δ     U+03B4
        * \textepsilon          he.decode '&epsilon;'   # ε     U+03B5
        * \textzeta             he.decode '&zeta;'      # ζ     U+03B6
        * \texteta              he.decode '&eta;'       # η     U+03B7
        * \texttheta            he.decode '&thetasym;'  # ϑ     U+03D1  (θ = U+03B8)
        * \textiota             he.decode '&iota;'      # ι     U+03B9
        * \textkappa            he.decode '&kappa;'     # κ     U+03BA
        * \textlambda           he.decode '&lambda;'    # λ     U+03BB
        * \textmu               he.decode '&mu;'        # μ     U+03BC  this is better than \u00B5, LaTeX's original
        * \textmugreek          he.decode '&mu;'
        * \textnu               he.decode '&nu;'        # ν     U+03BD
        * \textxi               he.decode '&xi;'        # ξ     U+03BE
        * \textomikron          he.decode '&omicron;'   # ο     U+03BF
        * \textpi               he.decode '&pi;'        # π     U+03C0
        * \textrho              he.decode '&rho;'       # ρ     U+03C1
        * \textsigma            he.decode '&sigma;'     # σ     U+03C3
        * \texttau              he.decode '&tau;'       # τ     U+03C4
        * \textupsilon          he.decode '&upsilon;'   # υ     U+03C5
        * \textphi              he.decode '&phi;'       # φ     U+03C6
        * \textchi              he.decode '&chi;'       # χ     U+03C7
        * \textpsi              he.decode '&psi;'       # ψ     U+03C8
        * \textomega            he.decode '&omega;'     # ω     U+03C9

        # greek letters - upper case
        * \textAlpha            he.decode '&Alpha;'     # Α     U+0391
        * \textBeta             he.decode '&Beta;'      # Β     U+0392
        * \textGamma            he.decode '&Gamma;'     # Γ     U+0393
        * \textDelta            he.decode '&Delta;'     # Δ     U+0394
        * \textEpsilon          he.decode '&Epsilon;'   # Ε     U+0395
        * \textZeta             he.decode '&Zeta;'      # Ζ     U+0396
        * \textEta              he.decode '&Eta;'       # Η     U+0397
        * \textTheta            he.decode '&Theta;'     # Θ     U+0398
        * \textIota             he.decode '&Iota;'      # Ι     U+0399
        * \textKappa            he.decode '&Kappa;'     # Κ     U+039A
        * \textLambda           he.decode '&Lambda;'    # Λ     U+039B
        * \textMu               he.decode '&Mu;'        # Μ     U+039C
        * \textNu               he.decode '&Nu;'        # Ν     U+039D
        * \textXi               he.decode '&Xi;'        # Ξ     U+039E
        * \textOmikron          he.decode '&Omicron;'   # Ο     U+039F
        * \textPi               he.decode '&Pi;'        # Π     U+03A0
        * \textRho              he.decode '&Rho;'       # Ρ     U+03A1
        * \textSigma            he.decode '&Sigma;'     # Σ     U+03A3
        * \textTau              he.decode '&Tau;'       # Τ     U+03A4
        * \textUpsilon          he.decode '&Upsilon;'   # Υ     U+03A5
        * \textPhi              he.decode '&Phi;'       # Φ     U+03A6
        * \textChi              he.decode '&Chi;'       # Χ     U+03A7
        * \textPsi              he.decode '&Psi;'       # Ψ     U+03A8
        * \textOmega            he.decode '&Omega;'     # Ω     U+03A9


        * \textvarsigma         he.decode '&sigmaf;'    # ς     U+03C2
        * \straightphi          '\u03D5'                # ϕ
        * \scripttheta          '\u03D1'                # ϑ
        * \straighttheta        he.decode '&theta;'     # θ     U+03B8
        * \straightepsilon      '\u03F5'                # ϵ
    ])