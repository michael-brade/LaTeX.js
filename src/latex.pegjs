{
    var compiler = new (require('./compiler').Compiler);
}


document =
    text+   { return compiler.html(); }

text =
    !break s:(nl / sp)+         { compiler.processSpace(); } /
    break                       { compiler.processParagraphBreak(); } /
    n:nbsp                      { compiler.processNbsp(n); } /
    w:char+                     { compiler.processWord(w.join("")); } /
    p:punctuation               { compiler.processPunctuation(p); } /
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
        compiler.processCommand();
    }

environment =
    b:begin
        c:(text*)
    e:end

    {
        compiler.processEnvironment(b, c, e);
        
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
    { return compiler.nl(); }

char "character" =
    c:[a-z0-9]i
    { return compiler.character(c); }
    
esc "escaped character" =
    "\\" c:[%&\\_]
    { return compiler.escapedCharacter(c); }
    
punctuation =
    p:[.,\-\*]
    { return compiler.character(p); }

sp "whitespace" =
    [ \t]+
    { return compiler.sp(); }

nbsp "non-breakable whitespace" =
    "~"
    { return compiler.nbsp(); }


EOF =
    !.
