{
    var g = new (require('./html-generator').HtmlGenerator);
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
    b:break? skip_space p:text+                 { b && g.break(); return g.create(g.paragraph, p); }
    / e:environment                             { g.continue(); return e; }


// here, an empty line or \par is just a linebreak - needed in some macro arguments
paragraph_with_linebreak =
    text
    / environment
    / break                                     { return g.create(g.linebreak); }


text "text" =
    p:(
        ligature
      / emdash / endash
      / primitive
      / !break comment (sp / nl)*               { return undefined; }
    )+                                          { return g.createText(p.join("")); }

    / linebreak                                 { return g.create(g.linebreak); }
    / macro
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
    / symbol
    / left_br
                                              // a right bracket is only allowed if we are in an open (unbalanced) group
    / b:right_br                              & { return !g.isBalanced() } { return b; }
    / nbsp
    / ctl_sym
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
    id:(char / "_" / ":")+                      { return id.join("") }



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


macro "macro" =
    escape !(begin/end/par)
    m:(
      custom_macro
    / textfamily / textweight / textshape
    / textnormal / emph / underline

    / fontfamily / fontweight / fontshape
    / normalfont / em

    / fontsize

    / centering / raggedright / raggedleft
    / unknown_macro
    )
    { return m; }




custom_macro "user-defined macro" =
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


underline       =   "underline"                     !char   &{ g.enterGroup(); g.addAttribute("underline"); return true; }
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

centering       =   "centering"             !char skip_space    { g.setAlignment("center"); }
raggedright     =   "raggedright"           !char skip_space    { g.setAlignment("raggedright"); }
raggedleft      =   "raggedleft"            !char skip_space    { g.setAlignment("raggedleft"); }





/****************/
/* environments */
/****************/

begin_env "\\begin" =
    b:break? skip_space
    escape begin                                { b && g.break(); }

end_env "\\end" =
    skip_all_space
    escape end
    begin_group id:identifier end_group         { return id; }

environment "environment" =
    begin_env begin_group e:(
        itemize
      / unknown_environment
    )
    id:end_env
    {
        // each environment has to return a json object: { name: <name in begin>, node: <content node> }
        if (e.name != id)
            error("environment <b>" + e.name + "</b> is missing its end, found " + id + " instead");

        return e.node;
    }


unknown_environment =
    e:identifier
    { error("unknown environment: " + e); }


    
// lists: itemize, enumerate, description

itemize "itemize environment" =
    name:"itemize" end_group
        items:(item (!(item/end_env) paragraph_with_linebreak)*)*
    {
        // if l == itemize

        return {
            name: name,
            node: g.create(g.unorderedList,
                        items.map(function(item_pwtext) {
                            return g.create(g.listitem,
                                // this becomes the paragraph_with_linebreak fragment
                                item_pwtext[1].map(function(text) { return text[1]; })
                            );
                        }))
        }
    }


item =
    skip_all_space escape "item" og:optgroup? skip_space
    { return og; }


// comment

comment_env "comment environment" =
    "\\begin{comment}"
        (!end_comment .)*
    end_comment skip_space
    { g.break(); return undefined; }

end_comment = "\\end{comment}"




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

/* kind of keywords */

begin                       = "begin"   !char
end                         = "end"     !char

par                         = "par"     !char




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

comment         "comment"   = "%"  (!nl .)* (nl / EOF)                                      // catcode 14, including the newline
                            / comment_env                       { return undefined; }       //             and the comment environment

skip_space      "spaces"    = (!break (nl / sp / comment))*     { return undefined; }
skip_all_space  "spaces"    = (nl / sp / comment)*              { return undefined; }

space           "spaces"    = !break
                              (sp / nl)+ comment* (sp / nl)*    { return g.brsp; }

break   "paragraph break"   = (skip_all_space escape par skip_all_space)+   // a paragraph break is either \par embedded in spaces,
                              /                                             // or
                              sp*
                              (nl / comment)                                // a paragraph break is a newline...
                              (sp* nl)+                                     // followed by one or more newlines, mixed with spaces,...
                              (sp / nl / comment)*                          // ...and optionally followed by any whitespace and/or comment


/* syntax tokens - LaTeX */

linebreak       "linebreak" = escape "\\" '*'? skip_space       { return undefined; }

// Note that these are in reality also just text! I'm just using a separate rule to make it look like syntax, but
// brackets do not need to be balanced.

begin_optgroup              = "["                               { return undefined; }
end_optgroup                = "]"                               { return undefined; }


/* text tokens - symbols that generate output */

char        "letter"        = c:[a-z]i                          { return g.character(c); }  // catcode 11
ligature    "ligature"      = l:("ffi" / "ffl" / "ff" / "fi" / "fl"
                                / "!´" / "?´" / "<<" / ">>")    // TODO: add "' and "`?
                                                                { return g.ligature(l); }

digit       "digit"         = n:[0-9]                           { return g.character(n); }  // catcode 12 (other)
punctuation "punctuation"   = p:[.,;:\*/()!?=+<>]               { return g.character(p); }  // catcode 12
quotes      "quotes"        = q:[“”"'«»]                        { return g.character(q); }  // catcode 12
left_br     "left bracket"  = b:"["                             { return g.character(b); }  // catcode 12
right_br    "right bracket" = b:"]"                             { return g.character(b); }  // catcode 12

utf8_char   "utf8 char"     = !(sp / nl / escape / begin_group / end_group / math_shift / alignment_tab / macro_parameter /
                                superscript / subscript / ignore / comment / begin_optgroup / end_optgroup /* primitive */)
                               u:.                              { return g.character(u); }  // catcode 12 (other)

nbsp        "non-brk space" = '~'                               { return g.nbsp; }          // catcode 13 (active)

hyphen      "hyphen"        = "-"                               { return g.hyphen; }
endash      "endash"        = "--"                              { return g.endash; }
emdash      "emdash"        = "---"                             { return g.emdash; }

ctl_sym     "control symbol"= escape c:[$%#&~{}_^\-, ]          { return g.controlSymbol(c); }




/* TeX language */

// \symbol{}= \char
// \char98  = decimal 98
// \char'77 = octal 77
// \char"FF = hex FF
// ^^FF     = hex FF
// ^^^^FFFF = hex FFFF
// ^^c      = if charcode(c) < 64 then fromCharCode(c+64) else fromCharCode(c-64) (TODO)
charsym     = escape "symbol" begin_group skip_space i:charnumber skip_space end_group  { return String.fromCharCode(i); }
            / escape "char" i:charnumber                        { return String.fromCharCode(i); }
            / "^^^^" i:hex64                                    { return String.fromCharCode(i); }
            / "^^"   i:hex32                                    { return String.fromCharCode(i); }


charnumber  =     i:int                                         { return parseInt(i, 10); }
            / "'" o:oct                                         { return parseInt(i, 8); }
            / '"' h:(hex64/hex32)                               { return h; }

hex32       = h:$(hex hex)                                      { return parseInt(h, 16); }
hex64       = h:$(hex hex hex hex)                              { return parseInt(h, 16); }

int         = $[0-9]+
oct         = $[0-7]+
hex         = [a-f0-9]i

float       = $([+\-]? (int? ('.' int?)? / '.' int))
