export const ligatures = new Map<string, string>([
    ['ff',                      '\uFB00'],              // ﬀ
    ['ffi',                     '\uFB03'],              // ﬃ
    ['ffl',                     '\uFB04'],              // ﬄ
    ['fi',                      '\uFB01'],              // ﬁ
    ['fl',                      '\uFB02'],              // ﬂ
    ['``',                      '\u201C'],              // “
    ["''",                      '\u201D'],              // ”
    ['!´',                      '\u00A1'],              // ¡
    ['?´',                      '\u00BF'],              // ¿
    ['--',                      '\u2013'],              // –
    ['---',                     '\u2014'],              // —

    ['<<',                      '\u00AB'],              // «
    ['>>',                      '\u00BB'],              // »

    // defined by german
    ['"`',                      '\u201E'],              // „   \quotedblbase
    ['"\'',                     '\u201C']               // “   \textquotedblleft
]);

export const diacritics = new Map<string, string[]>([
    ['b',                       ['\u0332', '\u005F']],        // _  first: combining char, second: standalone char
    ['c',                       ['\u0327', '\u00B8']],        // ¸
    ['d',                       ['\u0323', '\u200B \u0323']], //
    ['H',                       ['\u030B', '\u02DD']],        // ˝
    ['k',                       ['\u0328', '\u02DB']],        // ˛
    ['r',                       ['\u030A', '\u02DA']],        // ˚
    ['t',                       ['\u0361', '\u200B \u0361']], //
    ['u',                       ['\u0306', '\u02D8']],        // ˘
    ['v',                       ['\u030C', '\u02C7']],        // ˇ
    ['"',                       ['\u0308', '\u00A8']],        // ¨
    ['~',                       ['\u0303', '\u007E']],        // ~
    ['^',                       ['\u0302', '\u005E']],        // ^
    ['`',                       ['\u0300', '\u0060']],        // `
    ['\'',                      ['\u0301', '\u00B4']],        // ´
    ['=',                       ['\u0304', '\u00AF']],        // ¯
    ['.',                       ['\u0307', '\u02D9']]         // ˙
]);

// tuenc.def (LuaLaTeX, XeLaTeX; (PDF)LaTeX would use t1enc.def, ot1enc.def, etc. and need textcomp.sty)
export const symbols = new Map<string, string>([
    // spaces
    ['space',                   ' '],                   //
    ['nobreakspace',            '\u00A0'],              // ~
    ['thinspace',               '\u2009'],              //
    ['enspace',                 '\u2002'],              //    (en quad: U+2000)
    ['enskip',                  '\u2002'],              //
    ['quad',                    '\u2003'],              //    (em quad: U+2001)
    ['qquad',                   '\u2003'.repeat(2)],

    ['textvisiblespace',        '\u2423'],              // ␣
    ['textcompwordmark',        '\u200C'],              //

    // basic latin
    ['textdollar',              '$'],                   // $  \$
    ['$',                       '$'],                   // $
    ['slash',                   '\u002F'],              // /
    ['textless',                '<'],                   // <
    ['textgreater',             '>'],                   // >
    ['textbackslash',           '\u005C'],              // \
    ['textasciicircum',         '^'],                   // ^  \^{}
    ['textunderscore',          '_'],                   // _  \_
    ['_',                       '_'],                   // _
    ['lbrack',                  '['],                   // [
    ['rbrack',                  ']'],                   // ]
    ['textbraceleft',           '{'],                   // {  \{
    ['{',                       '{'],                   // {
    ['textbraceright',          '}'],                   // }  \}
    ['}',                       '}'],                   // }
    ['textasciitilde',          '˜'],                   // ˜  \~{}  (tuenc.def uses the ASCII tilde U+007E)

    // non-ASCII letters
    ['AA',                      '\u00C5'],              // Å
    ['aa',                      '\u00E5'],              // å
    ['AE',                      '\u00C6'],              // Æ
    ['ae',                      '\u00E6'],              // æ
    ['OE',                      '\u0152'],              // Œ
    ['oe',                      '\u0153'],              // œ
    ['DH',                      '\u00D0'],              // Ð
    ['dh',                      '\u00F0'],              // ð
    ['DJ',                      '\u0110'],              // Đ
    ['dj',                      '\u0111'],              // đ
    ['NG',                      '\u014A'],              // Ŋ
    ['ng',                      '\u014B'],              // ŋ
    ['TH',                      '\u00DE'],              // Þ
    ['th',                      '\u00FE'],              // þ
    ['O',                       '\u00D8'],              // Ø
    ['o',                       '\u00F8'],              // ø
    ['i',                       '\u0131'],              // ı
    ['j',                       '\u0237'],              // ȷ
    ['L',                       '\u0141'],              // Ł
    ['l',                       '\u0142'],              // ł
    ['IJ',                      '\u0132'],              // Ĳ
    ['ij',                      '\u0133'],              // ĳ
    ['SS',                      '\u1E9E'],              // ẞ
    ['ss',                      '\u00DF'],              // ß

    // quotes
    ['textquotesingle',         '\''],                  // '
    ['textquoteleft',           '\u2018'],              // ‘   \lq
    ['lq',                      '\u2018'],              // ‘
    ['textquoteright',          '\u2019'],              // ’   \rq
    ['rq',                      '\u2019'],              // ’
    ['textquotedbl',            '\u0022'],              // "
    ['textquotedblleft',        '\u201C'],              // “
    ['textquotedblright',       '\u201D'],              // ”
    ['quotesinglbase',          '\u201A'],              // ‚
    ['quotedblbase',            '\u201E'],              // „
    ['guillemotleft',           '\u00AB'],              // «
    ['guillemotright',          '\u00BB'],              // »
    ['guilsinglleft',           '\u2039'],              // ‹
    ['guilsinglright',          '\u203A'],              // ›

    // diacritics
    ['textasciigrave',          '\u0060'],              // `
    ['textgravedbl',            '\u02F5'],              // ˵
    ['textasciidieresis',       '\u00A8'],              // ¨
    ['textasciiacute',          '\u00B4'],              // ´
    ['textacutedbl',            '\u02DD'],              // ˝
    ['textasciimacron',         '\u00AF'],              // ¯
    ['textasciicaron',          '\u02C7'],              // ˇ
    ['textasciibreve',          '\u02D8'],              // ˘
    ['texttildelow',            '\u02F7'],              // ˷

    // punctuation
    ['textendash',              '\u2013'],              // –
    ['textemdash',              '\u2014'],              // —
    ['textellipsis',            '\u2026'],              // …   \dots, \ldots
    ['dots',                    '\u2026'],              // …
    ['ldots',                   '\u2026'],              // …
    ['textbullet',              '\u2022'],              // •
    ['textopenbullet',          '\u25E6'],              // ◦
    ['textperiodcentered',      '\u00B7'],              // ·
    ['textdagger',              '\u2020'],              // †   \dag
    ['dag',                     '\u2020'],              // †
    ['textdaggerdbl',           '\u2021'],              // ‡   \ddag
    ['ddag',                    '\u2021'],              // ‡
    ['textexclamdown',          '\u00A1'],              // ¡
    ['textquestiondown',        '\u00BF'],              // ¿
    ['textinterrobang',         '\u203D'],              // ‽
    ['textinterrobangdown',     '\u2E18'],              // ⸘

    ['textsection',             '\u00A7'],              // §   \S
    ['S',                       '\u00A7'],              // §
    ['textparagraph',           '\u00B6'],              // ¶   \P
    ['P',                       '\u00B6'],              // ¶
    ['textblank',               '\u2422'],              // ␢

    // delimiters
    ['textlquill',              '\u2045'],              // ⁅
    ['textrquill',              '\u2046'],              // ⁆
    ['textlangle',              '\u2329'],              // 〈
    ['textrangle',              '\u232A'],              // 〉
    ['textlbrackdbl',           '\u301A'],              // 〚
    ['textrbrackdbl',           '\u301B'],              // 〛

    // legal symbols
    ['textcopyright',           '\u00A9'],              // ©   \copyright
    ['copyright',               '\u00A9'],              // ©
    ['textregistered',          '\u00AE'],              // ®
    ['textcircledP',            '\u2117'],              // ℗
    ['textservicemark',         '\u2120'],              // ℠
    ['texttrademark',           '\u2122'],              // ™

    // genealogical
    ['textmarried',             '\u26AD'],              // ⚭
    ['textdivorced',            '\u26AE'],              // ⚮

    // misc
    ['textordfeminine',         '\u00AA'],              // ª
    ['textordmasculine',        '\u00BA'],              // º

    ['textdegree',              '\u00B0'],              // °
    ['textmu',                  '\u00B5'],              // µ

    ['textbar',                 '\u007C'],              // |
    ['textbardbl',              '\u2016'],              // ‖
    ['textbrokenbar',           '\u00A6'],              // ¦

    ['textreferencemark',       '\u203B'],              // ※
    ['textdiscount',            '\u2052'],              // ⁒
    ['textcelsius',             '\u2103'],              // ℃
    ['textnumero',              '\u2116'],              // №
    ['textrecipe',              '\u211E'],              // ℞
    ['textestimated',           '\u212E'],              // ℮
    ['textbigcircle',           '\u25EF'],              // ◯
    ['textmusicalnote',         '\u266A'],              // ♪

    ['textohm',                 '\u2126'],              // Ω
    ['textmho',                 '\u2127'],              // ℧


    // arrows
    ['textleftarrow',           '\u2190'],              // ←
    ['textuparrow',             '\u2191'],              // ↑
    ['textrightarrow',          '\u2192'],              // →
    ['textdownarrow',           '\u2193'],              // ↓

    // math symbols
    ['textperthousand',         '\u2030'],              // ‰
    ['textpertenthousand',      '\u2031'],              // ‱
    ['textonehalf',             '\u00BD'],              // ½
    ['textthreequarters',       '\u00BE'],              // ¾
    ['textonequarter',          '\u00BC'],              // ¼
    ['textfractionsolidus',     '\u2044'],              // ⁄
    ['textdiv',                 '\u00F7'],              // ÷
    ['texttimes',               '\u00D7'],              // ×
    ['textminus',               '\u2212'],              // −
    ['textasteriskcentered',    '\u2217'],              // ∗
    ['textpm',                  '\u00B1'],              // ±
    ['textsurd',                '\u221A'],              // √
    ['textlnot',                '\u00AC'],              // ¬
    ['textonesuperior',         '\u00B9'],              // ¹
    ['texttwosuperior',         '\u00B2'],              // ²
    ['textthreesuperior',       '\u00B3'],              // ³

    // currencies
    ['texteuro',                '\u20AC'],              // €
    ['textcent',                '\u00A2'],              // ¢
    ['textsterling',            '\u00A3'],              // £   \pounds
    ['pounds',                  '\u00A3'],              // £
    ['textbaht',                '\u0E3F'],              // ฿
    ['textcolonmonetary',       '\u20A1'],              // ₡
    ['textcurrency',            '\u00A4'],              // ¤
    ['textdong',                '\u20AB'],              // ₫
    ['textflorin',              '\u0192'],              // ƒ
    ['textlira',                '\u20A4'],              // ₤
    ['textnaira',               '\u20A6'],              // ₦
    ['textpeso',                '\u20B1'],              // ₱
    ['textwon',                 '\u20A9'],              // ₩
    ['textyen',                 '\u00A5']               // ¥
]);
