{
    var generator = new (require('./html-generator').HtmlGenerator);
}


document =
    text+   { return generator.html(); }

text =
    !break s:(nl / sp)+         { generator.processSpace(); } /
    break                       { generator.processParagraphBreak(); } /
    n:nbsp                      { generator.processNbsp(n); } /
    w:char+                     { generator.processWord(w.join("")); } /
    p:punctuation               { generator.processPunctuation(p); } /
    environment / command /
    comment+

break "paragraph break" =
    nl (sp* nl+)+    // two or more newlines, mixed with spaces
    { return null; }

// TODO: command is a command until first whitespace after identifier or closing ] or }, or
command =
    !begin !end
    "\\" identifier ("{" text* "}")*
    {
        generator.processCommand();
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
