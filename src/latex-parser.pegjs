{
    var generator = new (require('./html-generator').HtmlGenerator);
}


document =
    (sp / nl / comment)*
    paragraph_with_parbreak*
    {
        generator.processParagraphBreak();  // the end of the document finishes the last paragraph
        return generator.html();
    }

paragraph =
    !break (nl / sp)+ comment* sp*  { generator.processSpace(); }
    / !break comment
    / p:(primitive)+        { generator.processString(p.join("")); }
    / p:punctuation         { generator.processString(p); }
    / g:group               { generator.processFragment(g); }
    / macro
    / environment

paragraph_with_parbreak =
    paragraph
    / break                 { generator.processParagraphBreak(); return true; }

paragraph_with_linebreak =
    paragraph
    / break                 { generator.processLineBreak(); return true; }

break "paragraph break" =
    sp*
    (nl / comment)          // a paragraph break is a newline...
    (sp* nl)+               // followed by one or more newlines, mixed with spaces,...
    (sp / nl / comment)*    // ...and optionally followed by any whitespace and/or comment


primitive =
    char
    / num
    / quotes
    / utf8_char
    / ctl_sym
    / nbsp
    / endash / emdash


group "group" =
    begin_group            &{ generator.beginGroup(); return true; }
        paragraph_with_linebreak*
    end_group               { return generator.endGroup(); }

optgroup "optional argument" =
    begin_optgroup         &{ generator.beginGroup(); return true; }
        (!end_optgroup paragraph_with_linebreak)*
    end_optgroup            { return generator.endGroup(); }


// supports TeX, LaTeX2e and LaTeX3 identifiers
identifier "identifier" =
    id:(char / "_" / ":")+  { return id.join("") }

macro "macro" =
    !begin_env !end_env
    escape name:identifier
    s:"*"?
    skip_space*
    args:(skip_space* optgroup skip_space* / skip_space* group)*
    {
        generator.processMacro(name, s != undefined, args.map(function(arg) {
            // each argument consists of an array of length 2 or 3 (each token above is one element), so
            //  length 3: optgroup at [1]
            //  length 2: group at [1]
            return {
                type: arg.length === 3 ? "optional" : "mandatory",
                value: arg[1]
            }
        }));
    }



environment "environment" =
    b:begin_env
        c:(paragraph_with_parbreak*)
    e:end_env

    {
        generator.processEnvironment(b, c, e);

        if (b != e)
            throw Error("line " + location().start.line + ": begin and end don't match!")

        if (!envs.includes(b))
            throw Error("unknown environment!")
    }

begin_env =
    escape "begin" begin_group id:identifier end_group
    { return id }

end_env =
    escape "end" begin_group id:identifier end_group
    { return id }






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


skip_space      = !break (nl / sp / comment) { return undefined; }
EOF             = !.


/* syntax tokens - LaTeX */

// Note that these are in reality also just text! I'm just using a separate rule to make it look like syntax, but
// brackets do not need to be balanced.

begin_optgroup  = "["  { return undefined; }
end_optgroup    = "]"  { return undefined; }


/* text tokens - symbols that generate output */

nl          "newline"        =   [\n\r]                  { return generator.sp; }            // catcode 5
sp          "whitespace"     =   [ \t]+                  { return generator.sp; }            // catcode 10
char        "letter"         = c:[a-z]i                  { return generator.character(c); }  // catcode 11
num         "digit"          = n:[0-9]                   { return generator.character(n); }  // catcode 12 (other)
punctuation "punctuation"    = p:[.,;:\-\*/()!?=+<>\[\]] { return generator.character(p); }  // catcode 12
quotes                       = q:[“”"'«»]                // TODO                             // catcode 12

utf8_char   "utf8 char"     = !(escape / begin_group / end_group / math_shift / alignment_tab / macro_parameter /
                                 superscript / subscript / ignore / comment / begin_optgroup / end_optgroup / nl /
                                 sp / char / num)
                               u:.                      { return generator.character(u); }  // catcode 12 (other)

nbsp   "non-breakable space" = '~'                      { return generator.nbsp; }          // catcode 13 (active)

endash                       = "--"                      { return generator.endash; }
emdash                       = "---"                     { return generator.emdash; }

ctl_sym "control symbol"     = escape c:[\\$%#&~{}_^, ] { return generator.controlSymbol(c); }
