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

macro =
    !begin !end
    "\\" identifier
    args:(
        "{" text* "}" /
        "[" text* "]" /
        (!break (nl / sp / comment))+
    )*

    {
        generator.processMacro();
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
    "\\begin{" id:identifier "}"
    { return id }

end =
    "\\end{" id:identifier "}"
    { return id }



/* IDs and plain text */

identifier =
    id:char+
    { return id.join("") }





/* comments */

comment =
    "%" (char / sp / nbsp)* (nl / EOF)  // everything up to and including the newline
    { return null }


/* tokens */

nl "newline" =
    [\n\r]
    { return generator.nl(); }

char "character" =
    c:[a-z0-9]i
    { return generator.character(c); }

esc "escaped character" =
    "\\" c:[%&\\_]
    { return generator.escapedCharacter(c); }

punctuation =
    p:[.,\-\*]
    { return generator.character(p); }

sp "whitespace" =
    [ \t]+
    { return generator.sp(); }

nbsp "non-breakable whitespace" =
    "~"
    { return generator.nbsp(); }


EOF =
    !.
