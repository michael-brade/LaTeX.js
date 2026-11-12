import { decode } from 'he';  // TODO: remove he completely, use unicode directly


export const ligatures = new Map<string, string>([
    ['ff',                  decode('&fflig;')],         // ﬀ   U+FB00
    ['ffi',                 decode('&ffilig;')],        // ﬃ   U+FB03
    ['ffl',                 decode('&ffllig;')],        // ﬄ   U+FB04
    ['fi',                  decode('&filig;')],         // ﬁ   U+FB01
    ['fl',                  decode('&fllig;')],         // ﬂ   U+FB02
    ['``',                  decode('&ldquo;')],         // “   U+201C
    ["''",                  decode('&rdquo;')],         // ”   U+201D
    ['!´',                  decode('&iexcl;')],         // ¡   U+00A1
    ['?´',                  decode('&iquest;')],        // ¿   U+00BF
    ['--',                  decode('&ndash;')],         // –   U+2013
    ['---',                 decode('&mdash;')],         // —   U+2014

    ['<<',                  decode('&laquo;')],         // «   U+00AB
    ['>>',                  decode('&raquo;')],         // »   U+00BB

    // defined by german
    ['"`',                  decode('&bdquo;')],         // „   U+201E  \quotedblbase
    ['"\'',                 decode('&ldquo;')]          // “   U+201C  \textquotedblleft
]);

export const diacritics = new Map<string, string[]>([
    ['b',                    ['\u0332', '\u005F']],        // _  first: combining char, second: standalone char
    ['c',                    ['\u0327', '\u00B8']],        // ¸
    ['d',                    ['\u0323', '\u200B \u0323']], //
    ['H',                    ['\u030B', '\u02DD']],        // ˝
    ['k',                    ['\u0328', '\u02DB']],        // ˛
    ['r',                    ['\u030A', '\u02DA']],        // ˚
    ['t',                    ['\u0361', '\u200B \u0361']], //
    ['u',                    ['\u0306', '\u02D8']],        // ˘
    ['v',                    ['\u030C', '\u02C7']],        // ˇ
    ['"',                    ['\u0308', '\u00A8']],        // ¨
    ['~',                    ['\u0303', '\u007E']],        // ~
    ['^',                    ['\u0302', '\u005E']],        // ^
    ['`',                    ['\u0300', '\u0060']],        // `
    ['\'',                   ['\u0301', '\u00B4']],        // ´
    ['=',                    ['\u0304', '\u00AF']],        // ¯
    ['.',                    ['\u0307', '\u02D9']]         // ˙
]);

// tuenc.def (LuaLaTeX, XeLaTeX; (PDF)LaTeX would use t1enc.def, ot1enc.def, etc. and need textcomp.sty)
export const symbols = new Map<string, string>([
    // spaces
    ['space',                ' '],
    ['nobreakspace',         decode('&nbsp;')],             //     U+00A0   ~
    ['thinspace',            decode('&thinsp;')],           //     U+2009
    ['enspace',              decode('&ensp;')],             //     U+2002   (en quad: U+2000)
    ['enskip',               decode('&ensp;')],
    ['quad',                 decode('&emsp;')],             //     U+2003   (em quad: U+2001)
    ['qquad',                decode('&emsp;').repeat(2)],

    ['textvisiblespace',     decode('&blank;')],            // ␣   U+2423
    ['textcompwordmark',     decode('&zwnj;')],             //     U+200C

    // basic latin
    ['textdollar',           '$'],                          //     U+0024    \$
    ['$',                    '$'],
    ['slash',                decode('&sol;')],              //     U+002F
    ['textless',             '<'],                          //     U+003C
    ['textgreater',          '>'],                          //     U+003E
    ['textbackslash',        '\u005C'],                     //     U+005C
    ['textasciicircum',      '^'],                          //     U+005E    \^{}
    ['textunderscore',       '_'],                          //     U+005F    \_
    ['_',                    '_'],
    ['lbrack',               '['],                          //     U+005B
    ['rbrack',               ']'],                          //     U+005D
    ['textbraceleft',        '{'],                          //     U+007B    \{
    ['{',                    '{'],
    ['textbraceright',       '}'],                          //     U+007D    \}
    ['}',                    '}'],
    ['textasciitilde',       '˜'],                          //     U+007E    \~{}

    // non-ASCII letters
    ['AA',                   '\u00C5'],                 // Å
    ['aa',                   '\u00E5'],                 // å
    ['AE',                   decode('&AElig;')],        // Æ   U+00C6
    ['ae',                   decode('&aelig;')],        // æ   U+00E6
    ['OE',                   decode('&OElig;')],        // Œ   U+0152
    ['oe',                   decode('&oelig;')],        // œ   U+0153
    ['DH',                   decode('&ETH;')],          // Ð   U+00D0
    ['dh',                   decode('&eth;')],          // ð   U+00F0
    ['DJ',                   decode('&Dstrok;')],       // Đ   U+0110
    ['dj',                   decode('&dstrok;')],       // đ   U+0111
    ['NG',                   decode('&ENG;')],          // Ŋ   U+014A
    ['ng',                   decode('&eng;')],          // ŋ   U+014B
    ['TH',                   decode('&THORN;')],        // Þ   U+00DE
    ['th',                   decode('&thorn;')],        // þ   U+00FE
    ['O',                    decode('&Oslash;')],       // Ø   U+00D8
    ['o',                    decode('&oslash;')],       // ø   U+00F8
    ['i',                    decode('&imath;')],        // ı   U+0131
    ['j',                    decode('&jmath;')],        // ȷ   U+0237
    ['L',                    decode('&Lstrok;')],       // Ł   U+0141
    ['l',                    decode('&lstrok;')],       // ł   U+0142
    ['IJ',                   decode('&IJlig;')],        // Ĳ   U+0132
    ['ij',                   decode('&ijlig;')],        // ĳ   U+0133
    ['SS',                   '\u1E9E'],                 // ẞ
    ['ss',                   decode('&szlig;')],        // ß   U+00DF

    // quotes
    ['textquotesingle',      '\''],                     // '   U+0027
    ['textquoteleft',        decode('&lsquo;')],        // ‘   U+2018    \lq
    ['lq',                   decode('&lsquo;')],
    ['textquoteright',       decode('&rsquo;')],        // ’   U+2019    \rq
    ['rq',                   decode('&rsquo;')],
    ['textquotedbl',         decode('&quot;')],         // "   U+0022
    ['textquotedblleft',     decode('&ldquo;')],        // “   U+201C
    ['textquotedblright',    decode('&rdquo;')],        // ”   U+201D
    ['quotesinglbase',       decode('&sbquo;')],        // ‚   U+201A
    ['quotedblbase',         decode('&bdquo;')],        // „   U+201E
    ['guillemotleft',        decode('&laquo;')],        // «   U+00AB
    ['guillemotright',       decode('&raquo;')],        // »   U+00BB
    ['guilsinglleft',        decode('&lsaquo;')],       // ‹   U+2039
    ['guilsinglright',       decode('&rsaquo;')],       // ›   U+203A

    // diacritics
    ['textasciigrave',       '\u0060'],                 // `
    ['textgravedbl',         '\u02F5'],                 // ˵
    ['textasciidieresis',    decode('&die;')],          // ¨   U+00A8
    ['textasciiacute',       decode('&acute;')],        // ´   U+00B4
    ['textacutedbl',         decode('&dblac;')],        // ˝   U+02DD
    ['textasciimacron',      decode('&macr;')],         // ¯   U+00AF
    ['textasciicaron',       decode('&caron;')],        // ˇ   U+02C7
    ['textasciibreve',       decode('&breve;')],        // ˘   U+02D8
    ['texttildelow',         '\u02F7'],                 // ˷

    // punctuation
    ['textendash',           decode('&ndash;')],        // –   U+2013
    ['textemdash',           decode('&mdash;')],        // —   U+2014
    ['textellipsis',         decode('&hellip;')],       // …   U+2026    \dots, \ldots
    ['dots',                 decode('&hellip;')],
    ['ldots',                decode('&hellip;')],
    ['textbullet',           decode('&bull;')],         // •   U+2022
    ['textopenbullet',       '\u25E6'],                 // ◦
    ['textperiodcentered',   decode('&middot;')],       // ·   U+00B7
    ['textdagger',           decode('&dagger;')],       // †   U+2020    \dag
    ['dag',                  decode('&dagger;')],
    ['textdaggerdbl',        decode('&Dagger;')],       // ‡   U+2021    \ddag
    ['ddag',                 decode('&Dagger;')],
    ['textexclamdown',       decode('&iexcl;')],        // ¡   U+00A1
    ['textquestiondown',     decode('&iquest;')],       // ¿   U+00BF
    ['textinterrobang',      '\u203D'],                 // ‽
    ['textinterrobangdown',  '\u2E18'],                 // ⸘

    ['textsection',          decode('&sect;')],         // §   U+00A7    \S
    ['S',                    decode('&sect;')],
    ['textparagraph',        decode('&para;')],         // ¶   U+00B6    \P
    ['P',                    decode('&para;')],
    ['textblank',            '\u2422'],                 // ␢

    // delimiters
    ['textlquill',           '\u2045'],                 // ⁅
    ['textrquill',           '\u2046'],                 // ⁆
    ['textlangle',           '\u2329'],                 // 〈
    ['textrangle',           '\u232A'],                 // 〉
    ['textlbrackdbl',        '\u301A'],                 // 〚
    ['textrbrackdbl',        '\u301B'],                 // 〛

    // legal symbols
    ['textcopyright',        decode('&copy;')],         // ©   U+00A9    \copyright
    ['copyright',            decode('&copy;')],
    ['textregistered',       decode('&reg;')],          // ®   U+00AE
    ['textcircledP',         decode('&copysr;')],       // ℗   U+2117
    ['textservicemark',      '\u2120'],                 // ℠
    ['texttrademark',        decode('&trade;')],        // ™   U+2122

    // genealogical
    ['textmarried',          '\u26AD'],                 // ⚭
    ['textdivorced',         '\u26AE'],                 // ⚮

    // misc
    ['textordfeminine',      decode('&ordf;')],         // ª   U+00AA
    ['textordmasculine',     decode('&ordm;')],         // º   U+00BA

    ['textdegree',           decode('&deg;')],          // °   U+00B0
    ['textmu',               decode('&micro;')],        // µ   U+00B5

    ['textbar',              '\u007C'],                 // |
    ['textbardbl',           decode('&Vert;')],         // ‖   U+2016
    ['textbrokenbar',        decode('&brvbar;')],       // ¦   U+00A6

    ['textreferencemark',    '\u203B'],                 // ※
    ['textdiscount',         '\u2052'],                 // ⁒
    ['textcelsius',          '\u2103'],                 // ℃   U+2103
    ['textnumero',           decode('&numero;')],       // №   U+2116
    ['textrecipe',           decode('&rx;')],           // ℞   U+211E
    ['textestimated',        '\u212E'],                 // ℮
    ['textbigcircle',        decode('&xcirc;')],        // ◯   U+25EF
    ['textmusicalnote',      decode('&sung;')],         // ♪   U+266A

    ['textohm',              '\u2126'],                 // Ω
    ['textmho',              '\u2127'],                 // ℧


    // arrows
    ['textleftarrow',        decode('&larr;')],         // ←   U+2190
    ['textuparrow',          decode('&uarr;')],         // ↑   U+2191
    ['textrightarrow',       decode('&rarr;')],         // →   U+2192
    ['textdownarrow',        decode('&darr;')],         // ↓   U+2193

    // math symbols
    ['textperthousand',      decode('&permil;')],       // ‰   U+2030
    ['textpertenthousand',   '\u2031'],                 // ‱
    ['textonehalf',          decode('&frac12;')],       // ½   U+00BD
    ['textthreequarters',    decode('&frac34;')],       // ¾   U+00BE
    ['textonequarter',       decode('&frac14;')],       // ¼   U+00BC
    ['textfractionsolidus',  decode('&frasl;')],        // ⁄   U+2044
    ['textdiv',              decode('&divide;')],       // ÷   U+00F7
    ['texttimes',            decode('&times;')],        // ×   U+00D7
    ['textminus',            decode('&minus;')],        // −   U+2212
    ['textasteriskcentered', decode('&lowast;')],       // ∗   U+2217
    ['textpm',               decode('&plusmn;')],       // ±   U+00B1
    ['textsurd',             decode('&radic;')],        // √   U+221A
    ['textlnot',             decode('&not;')],          // ¬   U+00AC
    ['textonesuperior',      decode('&sup1;')],         // ¹   U+00B9
    ['texttwosuperior',      decode('&sup2;')],         // ²   U+00B2
    ['textthreesuperior',    decode('&sup3;')],         // ³   U+00B3

    // currencies
    ['texteuro',             decode('&euro;')],         // €   U+20AC
    ['textcent',             decode('&cent;')],         // ¢   U+00A2
    ['textsterling',         decode('&pound;')],        // £   U+00A3    \pounds
    ['pounds',               decode('&pound;')],
    ['textbaht',             '\u0E3F'],                 // ฿
    ['textcolonmonetary',    '\u20A1'],                 // ₡
    ['textcurrency',         '\u00A4'],                 // ¤
    ['textdong',             '\u20AB'],                 // ₫
    ['textflorin',           '\u0192'],                 // ƒ
    ['textlira',             '\u20A4'],                 // ₤
    ['textnaira',            '\u20A6'],                 // ₦
    ['textpeso',             '\u20B1'],                 // ₱
    ['textwon',              '\u20A9'],                 // ₩
    ['textyen',              '\u00A5']                  // ¥
]);
