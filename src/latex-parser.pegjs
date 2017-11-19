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
    / e:environment                             { generator.continue(); return e; }


// here, an empty line is just a linebreak
paragraph_with_linebreak =
    text
    / environment
    / break                                     { return generator.create(generator.linebreak); }


text "text" =
      p:primitive+                              { return generator.createText(p.join("")); }
    / p:punctuation                             { return generator.createText(p); }
    / group
    / linebreak                                 { return generator.create(generator.linebreak); }
    / macro
    / space                                     { return generator.createText(generator.sp); }
    / !break comment (sp / nl)*                 { return undefined; }


space "space" =
    !break (sp / nl)+ comment* (sp / nl)*       { return generator.brsp; }


break "paragraph break" =
    (skip_all_space escape par skip_all_space)+ // a paragraph break is either \par embedded in spaces,
    /                                           // or
    sp*
    (nl / comment)                              // a paragraph break is a newline...
    (sp* nl)+                                   // followed by one or more newlines, mixed with spaces,...
    (sp / nl / comment)*                        // ...and optionally followed by any whitespace and/or comment


primitive "primitive" =
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
    s1:space?
        p:paragraph_with_linebreak*
    end_group
    s2:space?
    {
        s1 != undefined && p.unshift(generator.createText(s1));
        s2 != undefined && p.push(generator.createText(s2));
        return generator.createFragment(p);
    }

arggroup "mandatory argument" =
    begin_group
    s:space?
        p:paragraph_with_linebreak*
    end_group
    {
        s != undefined && p.unshift(generator.createText(s));
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



/* macros */


macro "macro" =
    escape !(begin/end/par)
    m:(
      custom_macro
    / unknown_macro
    )
    { return m; }


// supports TeX, LaTeX2e and LaTeX3 identifiers
identifier "identifier" =
    id:(char / "_" / ":")+                      { return id.join("") }

custom_macro "user-defined macro" =
    name:identifier &{ return generator.hasMacro(name); }
    starred:"*"?
    skip_space
    args:(skip_space optgroup skip_space / skip_space arggroup)*
    s:space?
    {
        var node = generator.processMacro(name, starred != undefined, args.map(function(arg) {
            // each argument consists of an array of length 2 or 3 (each token above is one element), so
            //  length 3: optgroup at [1]
            //  length 2: group at [1]
            return {
                ...(arg.length === 3) && {optional: true} || {mandatory: true},
                value: arg[1]
            }
        }));

        if (s != undefined) {
            if (node == undefined)
                node = generator.createText(s);
            else
                node = generator.createFragment([node, generator.createText(s)]);
        }

        return node;
    }

unknown_macro =
    m:identifier
    { error("unknown macro: " + m); }





/* environments */

begin_env "\\begin" =
    b:break? skip_space
    escape begin                                { b && generator.break(); }

end_env "\\end" =
    skip_all_space
    escape end



environment "environment" =
    begin_env begin_group
    e:(
        itemize
      / unknown_environment
    )
    { return e; }

itemize "itemize environment" =
    "itemize" end_group
        items:(item (!(item/end_env) paragraph_with_linebreak)*)*
    end_env begin_group "itemize" end_group
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


comment_env "comment environment" =
    "\\begin{comment}"
        (!end_comment .)*
    end_comment skip_space
    { generator.break(); return undefined; }

end_comment = "\\end{comment}"


unknown_environment =
    e:identifier
    { error("unknown environment: " + e); }



/* kind of keywords */

begin                       = "begin"
end                         = "end"

par                         = "par"



/* syntax tokens - TeX's first catcodes that generate no output */

escape                      = "\\"                          { return undefined; }           // catcode 0
begin_group                 = "{"                           { return undefined; }           // catcode 1
end_group                   = "}"                           { return undefined; }           // catcode 2
math_shift      "math"      = "$"                           { return undefined; }           // catcode 3
alignment_tab               = "&"                           { return undefined; }           // catcode 4

macro_parameter "parameter" = "#"                           { return undefined; }           // catcode 6
superscript                 = "^"                           { return undefined; }           // catcode 7
subscript                   = "_"                           { return undefined; }           // catcode 8
ignore                      = "\0"                          { return undefined; }           // catcode 9

comment         "comment"   = "%"  (!nl .)* (nl / EOF)                                      // catcode 14, including the newline
                            / comment_env                   { return undefined; }           //             and the comment environment


linebreak       "linebreak" = escape "\\" '*'? skip_space   { return undefined; }

skip_space      "spaces"    = (!break (nl / sp / comment))* { return undefined; }
skip_all_space  "spaces"    = (nl / sp / comment)*          { return undefined; }

EOF             "EOF"       = !.


/* syntax tokens - LaTeX */

// Note that these are in reality also just text! I'm just using a separate rule to make it look like syntax, but
// brackets do not need to be balanced.

begin_optgroup              = "["                       { return undefined; }
end_optgroup                = "]"                       { return undefined; }


/* these generate no output because they are handled further up */

nl          "newline"       = !'\r''\n' / '\r' / '\r\n' { return undefined; }               // catcode 5 (linux, os x, windows)
sp          "whitespace"    = [ \t]+                    { return undefined; }               // catcode 10

/* text tokens - symbols that generate output */

char        "letter"        = c:[a-z]i                  { return generator.character(c); }  // catcode 11
ligature    "ligature"      = l:("ffi" / "ffl" / "ff" / "fi" / "fl" / "!´" / "?´" / "<<" / ">>")
                                                        { return generator.ligature(l); }

num         "digit"         = n:[0-9]                   { return generator.character(n); }  // catcode 12 (other)
punctuation "punctuation"   = p:[.,;:\*/()!?=+<>\[\]]   { return generator.character(p); }  // catcode 12
quotes      "quotes"        = q:[“”"'«»]                // TODO: add "' and "`              // catcode 12

utf8_char   "utf8 char"     = !(escape / begin_group / end_group / math_shift / alignment_tab / macro_parameter /
                                 superscript / subscript / ignore / comment / begin_optgroup / end_optgroup / nl /
                                 sp / char / num / punctuation / quotes / nbsp / hyphen / endash / emdash / ctl_sym)
                               u:.                      { return generator.character(u); }  // catcode 12 (other)

nbsp        "non-brk space" = '~'                       { return generator.nbsp; }          // catcode 13 (active)

hyphen      "hyphen"        = "-"                       { return generator.hyphen; }
endash      "endash"        = "--"                      { return generator.endash; }
emdash      "emdash"        = "---"                     { return generator.emdash; }

ctl_sym     "control symbol"= escape c:[$%#&~{}_^\-, ]  { return generator.controlSymbol(c); }
