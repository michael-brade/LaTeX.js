{
    var g = options.generator;
}


document =
    & { g.startBalanced(); g.enterGroup(); return true; }
    skip_all_space            // drop spaces at the beginning of the document
    pars:paragraph*
    skip_all_space EOF        // drop spaces at the end of the document
    {
        g.exitGroup();
        g.endBalanced() || error("groups need to be balanced!");
        g.createDocument(pars);
        return g;
    }



paragraph =
    vmode_macro
    / (escape noindent)? b:break                { b && g.break(); return undefined; }
    // indent wins over noindent
    / skip_space n:(escape noindent)? p:text+   { return g.create(g.paragraph, p, n ? "noindent" : ""); }
    // continue: after an environment, it is possible to contine without a new paragraph
    / e:environment                             { g.continue(); return e; }



// here, an empty line or \par is just a linebreak - needed in some macro arguments
paragraph_with_linebreak =
    text
    / vmode_macro
    / environment
    / break                                     { return g.create(g.linebreak); }


text "text" =
    p:(
        ligature
      / primitive
      / !break comment                          { return undefined; }
      // !break, because comment eats a nl and we don't remember that afterwards - space rule also eats a nl
    )+                                          { return g.createText(p.join("")); }

    / linebreak
    / hmode_macro
    / math

    // groups
    / begin_group                             & { g.enterGroup(); return true; }
      s:space?                                  { return g.createText(s); }
    / end_group                               & { return !g.isBalanced() && g.exitGroup(); }
      s:space?                                  { return g.createText(s); }



primitive "primitive" =
      char
    / space                                     { return g.sp; }
    / hyphen
    / digit
    / punctuation
    / quotes
    / left_br
                                              // a right bracket is only allowed if we are in an open (unbalanced) group
    / b:right_br                              & { return !g.isBalanced() } { return b; }
    / nbsp
    / ctrl_space
    / ctrl_sym
    / symbol
    / charsym
    / utf8_char


// returns a unicode char/string
symbol "symbol macro" =
    escape name:identifier &{ return g.hasSymbol(name); }
    skip_space
    {
        return g.getSymbol(name);
    }


/**********/
/* macros */
/**********/

// supports TeX, LaTeX2e and LaTeX3 identifiers
identifier "identifier" =
    $(char / "_" / ":")+



// group balancing: groups have to be balanced inside arguments, inside environments, and inside a document.
// startBalanced() is used to start a new level inside of which groups have to be balanced.

arggroup "mandatory argument" =
    skip_space
    begin_group                                 & { g.enterGroup(); g.startBalanced(); return true; }
    s:space?
        p:paragraph_with_linebreak*
    end_group
    {
        g.endBalanced() || error("groups inside an argument need to be balanced!");
        g.exitGroup()   || error("there was no group to end");

        s != undefined && p.unshift(g.createText(s));
        return g.createFragment(p);
    }


optgroup "optional argument" =
    skip_space
    begin_optgroup                              & { g.startBalanced(); return true; }
        p:paragraph_with_linebreak*
    end_optgroup                                & { return g.isBalanced(); }
    {
        g.endBalanced();
        return g.createFragment(p);
    }


// macros that work in horizontal and vertical mode
macro =
    escape
    m:(
      fontfamily / fontweight / fontshape
    / normalfont / em

    / fontsize

    / centering / raggedright / raggedleft
    )
    { return m; }


// macros that only work in horizontal mode (include \leavevmode)
hmode_macro =
    macro
    /
    escape
    m:(
      custom_macro

    / noindent

    / textfamily / textweight / textshape
    / textnormal / emph / underline / url / href

    / smbskip_hmode / hspace / vspace_hmode
    )
    { return m; }


// macros that only work in vertical mode (include \par or check for \ifvmode)
vmode_macro =
    skip_all_space
    m:macro
    { return m; }
  /
    skip_all_space
    escape
    m:(
      part / chapter / section / subsection / subsubsection
    / vspace_vmode / addvspace / smbskip_vmode / smbbreak
    )
    skip_all_space
    { g.break(); return m; }


// test: does a vertical mode follow next? then don't add a space!
vmode_test =
    skip_all_space
    escape (
        "part" / "chapter" / "section" / "subsection" / "subsubsection" / "paragraph" / "subparagraph"
      / "addvspace" / ("small"/"med"/"big")"break" / "begin" / "end" / "item"
    ) !char

// user-defined macros have the disadvantage that all groups directly following them will
// be interpreted as arguments to the macro, so the macro will have to return the unused arguments
custom_macro "user-defined hmode macro" =
    name:identifier &{ return g.hasMacro(name); }
    starred:"*"?
    skip_space
    args:(o:optgroup { return { optional: true, value: o }; } / m:arggroup { return { mandatory: true, value: m }; })*
    s:space?
    {
        var node = g.processMacro(name, starred != undefined, args);

        if (s != undefined) {
            if (node == undefined)
                node = g.createText(s);
            else
                node = g.createFragment([node, g.createText(s)]);
        }

        return node;
    }

unknown_macro =
    m:identifier
    { error("unknown macro: " + m); }


// ** sectioning

tableofcontents =   "tableofcontents" !char skip_space {}

part            =   "part"          s:"*"?  t:arggroup { return g.create(g.part, t); }
chapter         =   "chapter"       s:"*"?  t:arggroup { return g.create(g.chapter, t); }
section         =   "section"       s:"*"?  t:arggroup { return g.create(g.section, t); }
subsection      =   "subsection"    s:"*"?  t:arggroup { return g.create(g.subsection, t); }
subsubsection   =   "subsubsection" s:"*"?  t:arggroup { return g.create(g.subsubsection, t); }

//paragraph       =   "paragraph"     s:"*"?  t:arggroup { return g.create(g.paragraph, t); }
subparagraph    =   "subparagraph"  s:"*"?  t:arggroup { return g.create(g.subparagraph, t); }


// ** font macros

// commands

textfamily      =   "text" f:("rm"/"sf"/"tt")       !char   &{ g.enterGroup(); g.setFontFamily(f); return true; }
                    a:arggroup
                    { g.exitGroup(); return a; }

textweight      =   "text" w:("md"/"bf")            !char   &{ g.enterGroup(); g.setFontWeight(w); return true; }
                    a:arggroup
                    { g.exitGroup(); return a; }

textshape       =   "text" s:("up"/"it"/"sl"/"sc")  !char   &{ g.enterGroup(); g.setFontShape(s); return true; }
                    a:arggroup
                    { g.exitGroup(); return a; }


textnormal      =   "textnormal"                    !char   &{ g.enterGroup(); g.setFontFamily("rm");
                                                                               g.setFontWeight("md");
                                                                               g.setFontShape("up"); return true; }
                    a:arggroup
                    { g.exitGroup(); return a; }


underline       =   "underline"                     !char   &{ g.enterGroup(); g.setTextDecoration("underline"); return true; }
                    a:arggroup
                    { g.exitGroup(); return a; }

emph            =   "emph"  a:arggroup
                    { return g.create(g.emph, a); }


// declarations

fontfamily      =   f:("rm"/"sf"/"tt")     "family" !char skip_space    { g.setFontFamily(f); }
fontweight      =   w:("md"/"bf")          "series" !char skip_space    { g.setFontWeight(w); }
fontshape       =   s:("up"/"it"/"sl"/"sc") "shape" !char skip_space    { g.setFontShape(s); }

normalfont      =   "normalfont"                    !char skip_space    { g.setFontFamily("rm");
                                                                          g.setFontWeight("md");
                                                                          g.setFontShape("up"); }

fontsize        =   s:("tiny"/"scriptsize"/"footnotesize"/"small"/"normalsize"/"large"/"Large"/"LARGE"/"huge"/"Huge")
                    !char skip_space
                    { g.setFontSize(s); }

em              =   "em"                            !char skip_space    { g.setFontShape("em"); }       // TODO: TOGGLE em?!


// color



// block level: alignment

centering       =   "centering"                     !char skip_space    { g.setAlignment("center"); }
raggedright     =   "raggedright"                   !char skip_space    { g.setAlignment("flushleft"); }
raggedleft      =   "raggedleft"                    !char skip_space    { g.setAlignment("flushright"); }



// ** spacing macros

// vertical
vspace_hmode    =   "vspace" "*"?                   !char l:lengthgroup { return g.createVSpaceInline(l); }
vspace_vmode    =   "vspace" "*"?                   !char l:lengthgroup { return g.createVSpace(l); }

smbskip_hmode   =   s:$("small"/"med"/"big")"skip"  !char skip_space    { return g.createVSpaceSkipInline(s + "skip"); }
smbskip_vmode   =   s:$("small"/"med"/"big")"skip"  !char skip_space    { return g.createVSpaceSkip(s + "skip"); }

// only in vmode possible
addvspace       =   "addvspace"                     !char l:lengthgroup { return g.createVSpace(l); }   // TODO not correct?
smbbreak        =   s:$("small"/"med"/"big")"break" !char skip_space    { return g.createVSpaceSkip(s + "skip"); }

//  \\[length] is defined in the linebreak rule further down



// horizontal
hspace          =   "hspace" "*"?                   !char l:lengthgroup { return g.createHSpace(l); }

//stretch         =   "stretch"               arggroup
//hphantom        =   "hphantom"              !char skip_space

// hfill           = \hspace{\fill}
// dotfill         =
// hrulefill       =


// lengths
length_unit     =   skip_space u:("pt" / "mm" / "cm" / "in" / "ex" / "em") !char skip_space
                    { return u; }

length          =   l:float u:length_unit (plus float length_unit)? (minus float length_unit)?
                    { return l + u; }

lengthgroup     =   skip_space begin_group skip_space l:length end_group
                    { return l; }


// label, ref



// hyperref

url_charset     =   char/digit/hyphen/punctuation/"#"/"&"/escape? "%" { return "%" }
                /   . &{ error("illegal char in url given"); }

url             =   "url"   skip_space begin_group
                        url:(!end_group c:url_charset {return c;})+
                    end_group
                    {
                        return g.create(g.link(url.join("")), [g.createText(url.join(""))]);
                    }

href            =   "href"  skip_space begin_group
                        url:(!end_group c:url_charset {return c;})+
                    end_group
                    txt:arggroup
                    {
                        return g.create(g.link(url.join("")), txt);
                    }

// \hyperref[label_name]{''link text''} --- just like \ref{label_name}, only an <a>
hyperref        =   "hyperref" skip_space optgroup


/****************/
/* environments */
/****************/

begin_env "\\begin" =
    skip_all_space
    escape begin                                { g.break(); }

end_env "\\end" =
    skip_all_space
    escape end
    begin_group id:identifier end_group         { return id; }

environment "environment" =
    begin_env begin_group                       & { g.enterGroup(); g.startBalanced(); return true; }
    e:(
        list
      / quote_quotation_verse
      / font
      / alignment
      / multicols
      / unknown_environment
    )
    id:end_env
    {
        // each environment has to return a json object: { name: <name in begin>, node: <content node> }
        if (e.name != id)
            error("environment <b>" + e.name + "</b> is missing its end, found " + id + " instead");

        g.endBalanced() || error(e.name + ": groups need to be balanced in environments!");
        g.exitGroup()   || error("there was no group to end");

        return e.node;
    }


unknown_environment =
    e:identifier
    { error("unknown environment: " + e); }



// lists: itemize, enumerate, description

list "list environment" =
    name:("itemize"/"enumerate"/"description") end_group
        items:(
               item:item  &{ g.break(); return true; }              // break when starting an item
               pars:(!(item/end_env) p:paragraph { return p; })*    // collect paragraphs in pars
               { return [item, pars]; }
              )*
    {
        var list, item, term;

        g.break();

        if (name === "itemize")         { list = g.unorderedList;   item = g.listitem; }
        else if (name === "enumerate")  { list = g.orderedList;     item = g.listitem; }
        else                            { list = g.descriptionList; item = g.description; term = g.term; }

        return {
            name: name,
            node: g.create(list,
                        items.map(function(item_pwtext) {
                            if (term) {
                                var dt = g.create(term, item_pwtext[0]);
                                var dd = g.create(item, item_pwtext[1]);
                                return g.createFragment([dt, dd]);
                            }

                            // TODO: giving an item in an (un)ordered list is not supported...
                            item_pwtext[1].unshift(item_pwtext[0]);
                            return g.create(item, item_pwtext[1]);
                        }))
        }
    }


item =
    skip_all_space escape "item" !char og:optgroup? skip_space
    { return og; }


// quote, quotation, verse
quote_quotation_verse =
    name:("quote"/"quotation"/"verse") end_group
    skip_space
        p:paragraph*
    {
        return {
            name: name,
            node: g.create(g[name], p)
        }
    }


// font environments

font =
    name:$
    ( size:  ("tiny"/"scriptsize"/"footnotesize"/"small"/
              "normalsize"/"large"/"Large"/"LARGE"/"huge"/"Huge")   &{ g.setFontSize(size); return true; }
    / family:("rm"/"sf"/"tt")"family"                               &{ g.setFontFamily(family); return true; }
    / weight:("md"/"bf")"series"                                    &{ g.setFontWeight(weight); return true; }
    / shape: ("up"/"it"/"sl"/"sc")"shape"                           &{ g.setFontShape(shape); return true; }
    / "normalfont"                                                  &{ g.setFontFamily("rm");
                                                                       g.setFontWeight("md");
                                                                       g.setFontShape("up"); return true; }
    ) end_group skip_space
    p:paragraph*
    {
        return {
            name: name,
            node: g.create(g.block, p)
        }
    }



// alignment:  flushleft, flushright, center

alignment =
    align:("flushleft"/"flushright"/"center")
    end_group
    skip_space
        p:paragraph*
    {
        // only set alignment on the g.list
        g.enterGroup();
        g.setAlignment(align);
        var node = g.create(g.list, p);
        g.exitGroup();

        return {
            name: align,
            node: node
        }
    }


// multicolumns


// switch to onecolumn layout from now on
onecolumn = "onecolumn" !char

// switch to twocolumn layout from now on
twocolumn = "twocolumn" !char o:optgroup?

// \begin{multicols}{number}[pretext][premulticols size]
multicols =
    name:("multicols") end_group
    conf:(begin_group c:digit end_group o:optgroup? optgroup? { return { cols: c, pre: o } }
         / &{ error("multicols error, required syntax: \\begin{multicols}{number}[pretext][premulticols size]") }
         )
    pars:paragraph*
    {
        var node = g.create(g.multicols(conf.cols), g.createFragment(pars))
        return {
            name: name,
            node: g.createFragment([conf.pre, node])
        }
    }


// comment

comment_env "comment environment" =
    "\\begin" skip_space "{comment}"
        (!end_comment .)*
    end_comment skip_space
    { g.break(); return undefined; }

end_comment = "\\end" skip_space "{comment}"




/**********/
/*  math  */
/**********/


math =
    inline_math / display_math

inline_math =
    math_shift            m:$math_primitive+ math_shift            { return g.parseMath(m, false); }

display_math =
    math_shift math_shift m:$math_primitive+ math_shift math_shift { return g.parseMath(m, true); }
    / escape left_br      m:$math_primitive+ escape right_br       { return g.parseMath(m, true); }


math_primitive =
    primitive
    / alignment_tab
    / superscript
    / subscript
    / escape identifier
    / begin_group skip_space end_group
    / begin_group math_primitive+ end_group
    / sp / nl / linebreak / comment


/* kind of keywords */

begin                       = "begin"       !char skip_space    {}
end                         = "end"         !char skip_space    {}

par                         = "par"         !char               {}
noindent                    = "noindent"    !char skip_space    {}

plus                        = "plus"        !char skip_space    {}
minus                       = "minus"       !char skip_space    {}



/* syntax tokens - TeX's first catcodes that generate no output */

escape                      = "\\"                              { return undefined; }       // catcode 0
begin_group                 = "{"                               { return undefined; }       // catcode 1
end_group                   = "}"                               { return undefined; }       // catcode 2
math_shift      "math"      = "$"                               { return undefined; }       // catcode 3
alignment_tab               = "&"                               { return undefined; }       // catcode 4

macro_parameter "parameter" = "#"                               { return undefined; }       // catcode 6
superscript                 = "^"                               { return undefined; }       // catcode 7
subscript                   = "_"                               { return undefined; }       // catcode 8
ignore                      = "\0"                              { return undefined; }       // catcode 9

EOF             "EOF"       = !.




/* space handling */

nl              "newline"   = !'\r''\n' / '\r' / '\r\n'         { return undefined; }       // catcode 5 (linux, os x, windows)
sp              "whitespace"= [ \t]                             { return undefined; }       // catcode 10

comment         "comment"   = "%"  (!nl .)* (nl sp* / EOF)                                  // catcode 14, including the newline
                            / comment_env                       { return undefined; }       //             and the comment environment

skip_space      "spaces"    = (!break (nl / sp / comment))*     { return undefined; }
skip_all_space  "spaces"    = (nl / sp / comment)*              { return undefined; }

space           "spaces"    = !break !linebreak !vmode_test
                              (sp / nl)+                        { return g.brsp; }

ctrl_space  "control space" = escape (&nl &break / nl / sp)     { return g.brsp; }

nbsp        "non-brk space" = "~"                               { return g.nbsp; }          // catcode 13 (active)

break     "paragraph break" = (skip_all_space escape par skip_all_space)+   // a paragraph break is either \par embedded in spaces,
                              /                                             // or
                              sp*
                              (nl comment* / comment+)                      // a paragraph break is a newline...
                              ((sp* nl)+ / EOF)                             // ...followed by one or more newlines, mixed with spaces,...
                              (sp / nl / comment)*                          // ...and optionally followed by any whitespace and/or comment

linebreak       "linebreak" = skip_space escape "\\" skip_space '*'?
                              skip_space
                              l:(begin_optgroup skip_space
                                    l:length
                                end_optgroup skip_space {return l;})?
                              {
                                  if (l) return g.createBreakSpace(l);
                                  else   return g.create(g.linebreak);
                              }


/* syntax tokens - LaTeX */

// Note that these are in reality also just text! I'm just using a separate rule to make it look like syntax, but
// brackets do not need to be balanced.

begin_optgroup              = "["                               { return undefined; }
end_optgroup                = "]"                               { return undefined; }


/* text tokens - symbols that generate output */

char        "letter"        = c:[a-z]i                          { return g.character(c); }  // catcode 11
digit       "digit"         = n:[0-9]                           { return g.character(n); }  // catcode 12 (other)
punctuation "punctuation"   = p:[.,;:\*/()!?=+<>]               { return g.character(p); }  // catcode 12
quotes      "quotes"        = q:[“”"'«»]                        { return g.character(q); }  // catcode 12
left_br     "left bracket"  = b:"["                             { return g.character(b); }  // catcode 12
right_br    "right bracket" = b:"]"                             { return g.character(b); }  // catcode 12

utf8_char   "utf8 char"     = !(sp / nl / escape / begin_group / end_group / math_shift / alignment_tab / macro_parameter /
                                superscript / subscript / ignore / comment / begin_optgroup / end_optgroup /* primitive */)
                               u:.                              { return g.character(u); }  // catcode 12 (other)

hyphen      "hyphen"        = "-"                               { return g.hyphen; }

ligature    "ligature"      = l:("ffi" / "ffl" / "ff" / "fi" / "fl" / "---" / "--"
                                / "``" / "''" / "!´" / "?´" / "<<" / ">>")    // TODO: add "' and "`?
                                                                { return g.ligature(l); }

ctrl_sym    "control symbol"= escape c:[$%#&~{}_^\-,/@]         { return g.controlSymbol(c); }




/* TeX language */

// \symbol{}= \char
// \char98  = decimal 98
// \char'77 = octal 77
// \char"FF = hex FF
// ^^FF     = hex FF
// ^^^^FFFF = hex FFFF
// ^^c      = if charcode(c) < 64 then fromCharCode(c+64) else fromCharCode(c-64)
charsym     = escape "symbol"
              begin_group
                skip_space i:charnumber skip_space
              end_group                                         { return String.fromCharCode(i); }
            / escape "char" i:charnumber                        { return String.fromCharCode(i); }
            / "^^^^" i:hex16                                    { return String.fromCharCode(i); }
            / "^^"   i:hex8                                     { return String.fromCharCode(i); }
            / "^^"   c:.                                        { c = c.charCodeAt(0);
                                                                  return String.fromCharCode(c < 64 ? c + 64 : c - 64); }


charnumber  =     i:int                                         { return parseInt(i, 10); }
            / "'" o:oct                                         { return parseInt(o, 8); }
            / '"' h:(hex16/hex8)                                { return h; }


hex8  "8bit hex value"  = h:$(hex hex)                          { return parseInt(h, 16); }
hex16 "16bit hex value" = h:$(hex hex hex hex)                  { return parseInt(h, 16); }

int   "integer value"   = $[0-9]+
oct   "octal value"     = $[0-7]+
hex   "hex digit"       = [a-f0-9]i

float "float value"     = $([+\-]? (int? ('.' int?)? / '.' int))
