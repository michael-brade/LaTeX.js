{
    var generator = new (require('./html-generator').HtmlGenerator);
}


document =
    skip_all_space            // drop spaces at the beginning of the document
    blocks:block*
    skip_all_space EOF        // drop spaces at the end of the document
    {
        generator.createDocument(blocks);
        return generator.html();
    }


block =
    b:break? skip_space p:text+                 { b && generator.break(); return generator.create(generator.paragraph, p); }
    / e:environments                            { generator.continue(); return e; }


// here, an empty line is just a linebreak
paragraph_with_linebreak =
    text
    / environments
    / break                                     { return generator.create(generator.linebreak); }


text =
      p:primitive+                              { return generator.createText(p.join("")); }
    / p:punctuation                             { return generator.createText(p); }
    / group
    / linebreak                                 { return generator.create(generator.linebreak); }
    / macro
    / !break (sp / nl)+ comment* (sp / nl)*     { return generator.createText(generator.sp); }
    / !break comment (sp / nl)*                 { return undefined; }


break "paragraph break" =
    sp*
    (nl / comment)                              // a paragraph break is a newline...
    (sp* nl)+                                   // followed by one or more newlines, mixed with spaces,...
    (sp / nl / comment)*                        // ...and optionally followed by any whitespace and/or comment


primitive =
    ligature
    / emdash / endash / hyphen
    / char
    / num
    / quotes
    / nbsp
    / ctl_sym
    / utf8_char


group "group" =
    begin_group
        p:paragraph_with_linebreak*
    end_group
    {
        return generator.createFragment(p);
    }

optgroup "optional argument" =
    begin_optgroup
        p:(!end_optgroup paragraph_with_linebreak)*
    end_optgroup
    {
        return generator.createFragment(p.map(function(op) {
            return op[1]; // skip end_optgroup
        }));
    }


begin =
    b:break? skip_space escape "begin"          { b && generator.break(); }

end =
    skip_all_space escape "end"

// supports TeX, LaTeX2e and LaTeX3 identifiers
identifier "identifier" =
    id:(char / "_" / ":")+          { return id.join("") }

macro "macro" =
    escape !("begin"/"end") name:identifier
    s:"*"?
    skip_space
    args:(skip_space optgroup skip_space / skip_space group)*
    {
        return generator.processMacro(name, s != undefined, args.map(function(arg) {
            // each argument consists of an array of length 2 or 3 (each token above is one element), so
            //  length 3: optgroup at [1]
            //  length 2: group at [1]
            return {
                type: arg.length === 3 ? "optional" : "mandatory",
                value: arg[1]
            }
        }));
    }


environments =
    itemize

itemize =
    begin begin_group "itemize" end_group
        items:(item (!(item/end) paragraph_with_linebreak)*)*
    end begin_group "itemize" end_group
    {
        // if l == itemize

        return generator.create(generator.unorderedList,
                    items.map(function(item_pwtext) {
                        return generator.create(generator.listitem,
                            // this becomes the paragraph_with_linebreak fragment
                            item_pwtext[1].map(function(text) { return text[1]; })
                        );
                    })
               );
    }


item =
    skip_all_space escape "item" og:optgroup? skip_space
    { return og; }





/* syntax tokens - TeX's first catcodes that generate no output */

escape          = "\\" { return undefined; }                            // catcode 0
begin_group     = "{"  { return undefined; }                            // catcode 1
end_group       = "}"  { return undefined; }                            // catcode 2
math_shift      = "$"  { return undefined; }                            // catcode 3
alignment_tab   = "&"  { return undefined; }                            // catcode 4

macro_parameter = "#"  { return undefined; }                            // catcode 6
superscript     = "^"  { return undefined; }                            // catcode 7
subscript       = "_"  { return undefined; }                            // catcode 8
ignore          = "\0" { return undefined; }                            // catcode 9

comment         = "%"  (!nl .)* (nl / EOF)                              // catcode 14, including the newline
                       { return undefined; }

linebreak       = escape "\\" '*'? skip_space   { return undefined; }

skip_space      = (!break (nl / sp / comment))* { return undefined; }
skip_all_space  = (nl / sp / comment)*          { return undefined; }

EOF             = !.


/* syntax tokens - LaTeX */

// Note that these are in reality also just text! I'm just using a separate rule to make it look like syntax, but
// brackets do not need to be balanced.

begin_optgroup              = "["                       { return undefined; }
end_optgroup                = "]"                       { return undefined; }


/* these generate no output because they are handled further up */

nl          "newline"       = !'\r''\n' / '\r' / '\r\n' { return undefined; }               // catcode 5 (linux, os x, windows)
sp          "whitespace"    =   [ \t]+                  { return undefined; }               // catcode 10

/* text tokens - symbols that generate output */

char        "letter"        = c:[a-z]i                  { return generator.character(c); }  // catcode 11
ligature    "ligature"      = l:("ffi" / "ffl" / "ff" / "fi" / "fl" / "!´" / "?´" / "<<" / ">>")
                                                        { return generator.ligature(l); }

num         "digit"         = n:[0-9]                   { return generator.character(n); }  // catcode 12 (other)
punctuation "punctuation"   = p:[.,;:\*/()!?=+<>\[\]]   { return generator.character(p); }  // catcode 12
quotes                      = q:[“”"'«»]                // TODO: add "' and "`              // catcode 12

utf8_char   "utf8 char"     = !(escape / begin_group / end_group / math_shift / alignment_tab / macro_parameter /
                                 superscript / subscript / ignore / comment / begin_optgroup / end_optgroup / nl /
                                 sp / char / num / punctuation / quotes / nbsp / hyphen / endash / emdash / ctl_sym)
                               u:.                      { return generator.character(u); }  // catcode 12 (other)

nbsp   "non-breakable space" = '~'                      { return generator.nbsp; }          // catcode 13 (active)

hyphen      "hyphen"         = "-"                      { return generator.hyphen; }
endash      "endash"         = "--"                     { return generator.endash; }
emdash      "emdash"         = "---"                    { return generator.emdash; }

ctl_sym     "control symbol" = escape c:[$%#&~{}_^\-, ] { return generator.controlSymbol(c); }
