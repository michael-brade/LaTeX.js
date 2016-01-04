{
    var generator = new (require('./html-generator').HtmlGenerator);
}


document =
    text+                   { return generator.html(); }

text =
    !break s:(nl / sp)+     { generator.processSpace(); } /
    break                   { generator.processParagraphBreak(); } /
    n:nbsp                  { generator.processNbsp(n); } /
    w:char+                 { generator.processWord(w.join("")); } /
    p:punctuation           { generator.processPunctuation(p); } /
    environment / macro /
    comment

break "paragraph break" =
    (nl / comment)          // a paragraph break is a newline...
    (sp* nl)+               // followed by one or more newlines, mixed with spaces,...
    (sp / nl / comment)*    // ...and optionally followed by any whitespace and/or comment


// supports LaTeX2e and LaTeX3 identifiers
identifier =
    id:(char / "_" / ":")+  { return id.join("") }

macro =
    !begin !end
    escape name:identifier
    s:"*"?
    args:(
        begin_group t:text* end_group { return t.join(""); } /
        begin_optgroup t:text* end_optgroup { return t.join(""); } /
        (!break (nl / sp / comment))+ { return undefined; }
    )*

    {
        generator.processMacro(name, s != undefined, args);
    }

environment =
    b:begin
        c:(text*)
    e:end

    {
        generator.processEnvironment(b, c, e);

        if (b != e)
            throw Error("line " + location().start.line + ": begin and end don't match!")

        if (!envs.includes(b))
            throw Error("unknown environment!")
    }

begin =
    escape "begin" begin_group id:identifier end_group
    { return id }

end =
    escape "end" begin_group id:identifier end_group
    { return id }






/* syntax tokens - TeX's first catcodes */

escape          = "\\" { return undefined; }
begin_group     = "{"  { generator.beginGroup(); return undefined; }
end_group       = "}"  { generator.endGroup(); return undefined; }
math_shift      = "$"  { return undefined; }
alignment_tab   = "&"  { return undefined; }
macro_parameter = "#"  { return undefined; }
superscript     = "^"  { return undefined; }
subscript       = "_"  { return undefined; }
comment         = "%"  (!nl .)* (nl / EOF)  // everything up to and including the newline
                       { return undefined; }
EOF             = !.


/* syntax tokens - LaTeX */

begin_optgroup  = "["  { generator.beginGroup(); return undefined; }
end_optgroup    = "]"  { generator.endGroup(); return undefined; }


/* text tokens - symbols that generate output */

nl "newline"     =   [\n\r]         { return generator.sp(); }
sp "whitespace"  =   [ \t]+         { return generator.sp(); }
char "alpha-num" = c:[a-z0-9]i      { return generator.character(c); }
esc_char "escaped char" =
            escape c:[\\$%#&~{}_^]  { return generator.escapedCharacter(c); }

// TODO: write tests - maybe we need html entities for <,>,quotes,etc
punctuation =      p:[.,;:\-\*/()!?=+<>\[\]] { return generator.character(p); }

// TODO: maybe we won't need a rule for each symbol, use a generic symbol rule and method

nbsp "non-breakable space" =
    "~"     { return generator.nbsp(); }

quotes =    q:[“”"']

endash =
    "--"    { return generator.endash(); }

emdash =
    "---"   { return generator.emdash(); }
