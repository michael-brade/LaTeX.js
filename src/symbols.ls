import 'he'

export ligatures = new Map([
    * 'ff'                  he.decode '&fflig;'     #     U+FB00
    * 'ffi'                 he.decode '&ffilig;'    #     U+FB03
    * 'ffl'                 he.decode '&ffllig;'    #     U+FB04
    * 'fi'                  he.decode '&filig;'     #     U+FB01
    * 'fl'                  he.decode '&fllig;'     #     U+FB02
    * '``'                  he.decode '&ldquo;'     # “   U+201C
    * "''"                  he.decode '&rdquo;'     # ”   U+201D
    * '!´'                  he.decode '&iexcl;'     #     U+00A1
    * '?´'                  he.decode '&iquest;'    #     U+00BF
    * '--'                  he.decode '&ndash;'     #     U+2013
    * '---'                 he.decode '&mdash;'     #     U+2014

    * '<<'                  he.decode '&laquo;'     #     U+00AB
    * '>>'                  he.decode '&raquo;'     #     U+00BB

    # defined by german
    * '"`'                  he.decode '&bdquo;'     # „   U+201E  \quotedblbase
    * '"\''                 he.decode '&ldquo;'     # “   U+201C  \textquotedblleft
])

export diacritics = new Map([
    * \b                    ['\u0332', '\u005F']        # _  first: combining char, second: standalone char
    * \c                    ['\u0327', '\u00B8']        # ¸
    * \d                    ['\u0323', '\u200B \u0323'] #
    * \H                    ['\u030B', '\u02DD']        # ˝
    * \k                    ['\u0328', '\u02DB']        # ˛
    * \r                    ['\u030A', '\u02DA']        # ˚
    * \t                    ['\u0361', '\u200B \u0361'] #
    * \u                    ['\u0306', '\u02D8']        # ˘
    * \v                    ['\u030C', '\u02C7']        # ˇ
    * \"                    ['\u0308', '\u00A8']        # ¨
    * \~                    ['\u0303', '\u007E']        # ~
    * \^                    ['\u0302', '\u005E']        # ^
    * \`                    ['\u0300', '\u0060']        # `
    * \'                    ['\u0301', '\u00B4']        # ´
    * \=                    ['\u0304', '\u00AF']        # ¯
    * \.                    ['\u0307', '\u02D9']        # ˙
])

# tuenc.def (LuaLaTeX, XeLaTeX; (PDF)LaTeX would use t1enc.def, ot1enc.def, etc. and need textcomp.sty)
export symbols = new Map([
    # spaces
    * \space                ' '
    * \nobreakspace         he.decode '&nbsp;'      #     U+00A0   ~
    * \thinspace            he.decode '&thinsp;'    #     U+2009
    * \enspace              he.decode '&ensp;'      #     U+2002   (en quad: U+2000)
    * \enskip               he.decode '&ensp;'
    * \quad                 he.decode '&emsp;'      #     U+2003   (em quad: U+2001)
    * \qquad                he.decode '&emsp;'*2

    * \textvisiblespace     he.decode '&blank;'     # ␣   U+2423
    * \textcompwordmark     he.decode '&zwnj;'      #     U+200C

    # basic latin
    * \textdollar           '$'                     #     U+0024    \$
    * \$                    '$'
    * \slash                he.decode '&sol;'       #     U+002F
    * \textless             '<'                     #     U+003C
    * \textgreater          '>'                     #     U+003E
    * \textbackslash        '\u005C'                #     U+005C
    * \textasciicircum      '^'                     #     U+005E    \^{}
    * \textunderscore       '_'                     #     U+005F    \_
    * \_                    '_'
    * \lbrack               '['                     #     U+005B
    * \rbrack               ']'                     #     U+005D
    * \textbraceleft        '{'                     #     U+007B    \{
    * \{                    '{'
    * \textbraceright       '}'                     #     U+007D    \}
    * \}                    '}'
    * \textasciitilde       '˜'                     #     U+007E    \~{}

    # non-ASCII letters
    * \AA                   '\u00C5'                # Å
    * \aa                   '\u00E5'                # å
    * \AE                   he.decode '&AElig;'     # Æ   U+00C6
    * \ae                   he.decode '&aelig;'     # æ   U+00E6
    * \OE                   he.decode '&OElig;'     # Œ   U+0152
    * \oe                   he.decode '&oelig;'     # œ   U+0153
    * \DH                   he.decode '&ETH;'       # Ð   U+00D0
    * \dh                   he.decode '&eth;'       # ð   U+00F0
    * \DJ                   he.decode '&Dstrok;'    # Đ   U+0110
    * \dj                   he.decode '&dstrok;'    # đ   U+0111
    * \NG                   he.decode '&ENG;'       # Ŋ   U+014A
    * \ng                   he.decode '&eng;'       # ŋ   U+014B
    * \TH                   he.decode '&THORN;'     # Þ   U+00DE
    * \th                   he.decode '&thorn;'     # þ   U+00FE
    * \O                    he.decode '&Oslash;'    # Ø   U+00D8
    * \o                    he.decode '&oslash;'    # ø   U+00F8
    * \i                    he.decode '&imath;'     # ı   U+0131
    * \j                    he.decode '&jmath;'     # ȷ   U+0237
    * \L                    he.decode '&Lstrok;'    # Ł   U+0141
    * \l                    he.decode '&lstrok;'    # ł   U+0142
    * \IJ                   he.decode '&IJlig;'     # Ĳ   U+0132
    * \ij                   he.decode '&ijlig;'     # ĳ   U+0133
    * \SS                   '\u1E9E'                # ẞ
    * \ss                   he.decode '&szlig;'     # ß   U+00DF

    # quotes
    * \textquotesingle      "'"                     # '   U+0027
    * \textquoteleft        he.decode '&lsquo;'     # ‘   U+2018    \lq
    * \lq                   he.decode '&lsquo;'
    * \textquoteright       he.decode '&rsquo;'     # ’   U+2019    \rq
    * \rq                   he.decode '&rsquo;'
    * \textquotedbl         he.decode '&quot;'      # "   U+0022
    * \textquotedblleft     he.decode '&ldquo;'     # “   U+201C
    * \textquotedblright    he.decode '&rdquo;'     # ”   U+201D
    * \quotesinglbase       he.decode '&sbquo;'     # ‚   U+201A
    * \quotedblbase         he.decode '&bdquo;'     # „   U+201E
    * \guillemotleft        he.decode '&laquo;'     # «   U+00AB
    * \guillemotright       he.decode '&raquo;'     # »   U+00BB
    * \guilsinglleft        he.decode '&lsaquo;'    # ‹   U+2039
    * \guilsinglright       he.decode '&rsaquo;'    # ›   U+203A

    # diacritics
    * \textasciigrave       '\u0060'                # `
    * \textgravedbl         '\u02F5'                # ˵
    * \textasciidieresis    he.decode '&die;'       # ¨   U+00A8
    * \textasciiacute       he.decode '&acute;'     # ´   U+00B4
    * \textacutedbl         he.decode '&dblac;'     # ˝   U+02DD
    * \textasciimacron      he.decode '&macr;'      # ¯   U+00AF
    * \textasciicaron       he.decode '&caron;'     # ˇ   U+02C7
    * \textasciibreve       he.decode '&breve;'     # ˘   U+02D8
    * \texttildelow         '\u02F7'                # ˷

    # punctuation
    * \textendash           he.decode '&ndash;'     # –   U+2013
    * \textemdash           he.decode '&mdash;'     # —   U+2014
    * \textellipsis         he.decode '&hellip;'    # …   U+2026    \dots, \ldots
    * \dots                 he.decode '&hellip;'
    * \ldots                he.decode '&hellip;'
    * \textbullet           he.decode '&bull;'      # •   U+2022
    * \textopenbullet       '\u25E6'                # ◦
    * \textperiodcentered   he.decode '&middot;'    # ·   U+00B7
    * \textdagger           he.decode '&dagger;'    # †   U+2020    \dag
    * \dag                  he.decode '&dagger;'
    * \textdaggerdbl        he.decode '&Dagger;'    # ‡   U+2021    \ddag
    * \ddag                 he.decode '&Dagger;'
    * \textexclamdown       he.decode '&iexcl;'     # ¡   U+00A1
    * \textquestiondown     he.decode '&iquest;'    # ¿   U+00BF
    * \textinterrobang      '\u203D'                # ‽
    * \textinterrobangdown  '\u2E18'                # ⸘

    * \textsection          he.decode '&sect;'      # §   U+00A7    \S
    * \S                    he.decode '&sect;'
    * \textparagraph        he.decode '&para;'      # ¶   U+00B6    \P
    * \P                    he.decode '&para;'
    * \textblank            '\u2422'                # ␢

    # delimiters
    * \textlquill           '\u2045'                # ⁅
    * \textrquill           '\u2046'                # ⁆
    * \textlangle           '\u2329'                # 〈
    * \textrangle           '\u232A'                # 〉
    * \textlbrackdbl        '\u301A'                # 〚
    * \textrbrackdbl        '\u301B'                # 〛

    # legal symbols
    * \textcopyright        he.decode '&copy;'      # ©   U+00A9    \copyright
    * \copyright            he.decode '&copy;'
    * \textregistered       he.decode '&reg;'       # ®   U+00AE
    * \textcircledP         he.decode '&copysr;'    # ℗   U+2117
    * \textservicemark      '\u2120'                # ℠
    * \texttrademark        he.decode '&trade;'     # ™   U+2122

    # genealogical
    * \textmarried          '\u26AD'                # ⚭
    * \textdivorced         '\u26AE'                # ⚮

    # misc
    * \textordfeminine      he.decode '&ordf;'      # ª   U+00AA
    * \textordmasculine     he.decode '&ordm;'      # º   U+00BA

    * \textdegree           he.decode '&deg;'       # °   U+00B0
    * \textmu               he.decode '&micro;'     # µ   U+00B5

    * \textbar              '\u007C'                # |
    * \textbardbl           he.decode '&Vert;'      # ‖   U+2016
    * \textbrokenbar        he.decode '&brvbar;'    # ¦   U+00A6

    * \textreferencemark    '\u203B'                # ※
    * \textdiscount         '\u2052'                # ⁒
    * \textcelsius          '\u2103'                # ℃   U+2103
    * \textnumero           he.decode '&numero;'    # №   U+2116
    * \textrecipe           he.decode '&rx;'        # ℞   U+211E
    * \textestimated        '\u212E'                # ℮
    * \textbigcircle        he.decode '&xcirc;'     # ◯   U+25EF
    * \textmusicalnote      he.decode '&sung;'      # ♪   U+266A

    * \textohm              '\u2126'                # Ω
    * \textmho              '\u2127'                # ℧


    # arrows
    * \textleftarrow        he.decode '&larr;'      # ←   U+2190
    * \textuparrow          he.decode '&uarr;'      # ↑   U+2191
    * \textrightarrow       he.decode '&rarr;'      # →   U+2192
    * \textdownarrow        he.decode '&darr;'      # ↓   U+2193

    # math symbols
    * \textperthousand      he.decode '&permil;'    # ‰   U+2030
    * \textpertenthousand   '\u2031'                # ‱
    * \textonehalf          he.decode '&frac12;'    # ½   U+00BD
    * \textthreequarters    he.decode '&frac34;'    # ¾   U+00BE
    * \textonequarter       he.decode '&frac14;'    # ¼   U+00BC
    * \textfractionsolidus  he.decode '&frasl;'     # ⁄   U+2044
    * \textdiv              he.decode '&divide;'    # ÷   U+00F7
    * \texttimes            he.decode '&times;'     # ×   U+00D7
    * \textminus            he.decode '&minus;'     # −   U+2212
    * \textasteriskcentered he.decode '&lowast;'    # ∗   U+2217
    * \textpm               he.decode '&plusmn;'    # ±   U+00B1
    * \textsurd             he.decode '&radic;'     # √   U+221A
    * \textlnot             he.decode '&not;'       # ¬   U+00AC
    * \textonesuperior      he.decode '&sup1;'      # ¹   U+00B9
    * \texttwosuperior      he.decode '&sup2;'      # ²   U+00B2
    * \textthreesuperior    he.decode '&sup3;'      # ³   U+00B3

    # currencies
    * \texteuro             he.decode '&euro;'      # €   U+20AC
    * \textcent             he.decode '&cent;'      # ¢   U+00A2
    * \textsterling         he.decode '&pound;'     # £   U+00A3    \pounds
    * \pounds               he.decode '&pound;'
    * \textbaht             '\u0E3F'                # ฿
    * \textcolonmonetary    '\u20A1'                # ₡
    * \textcurrency         '\u00A4'                # ¤
    * \textdong             '\u20AB'                # ₫
    * \textflorin           '\u0192'                # ƒ
    * \textlira             '\u20A4'                # ₤
    * \textnaira            '\u20A6'                # ₦
    * \textpeso             '\u20B1'                # ₱
    * \textwon              '\u20A9'                # ₩
    * \textyen              '\u00A5'                # ¥
])
