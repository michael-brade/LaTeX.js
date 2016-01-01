{
    var envs = ["itemize", "description"];

    var html = ""; // maybe use jQuery and build a dom
    // alternatively: build a class-hierarchy of Paragraphs, Headings, Figures, Questions, Sharings, References


    function formatLocation(location) {
        return ""
    }

    /**
     * This should process \textbf{}, \sanskrit{}, \Sambodha (i.e., glossary terms), etc.
     */
    function processCommand(command, args) {

    }


    /**
     * This should process known environments
     */
    function processEnvironment(env, content) {

    }
}


document =
    d:text+

    {
        //return d
        return html
    }

text =
    b:break         { html += b } /
    !break n:nl     { html += n } /
    environment /
    c:command       { html += "<TODO:cmd>" } /
    t:char+         { html += t.join("") } /
    s:(sp / nbsp)   { html += s } /
    comment+


// TODO: command is a command until first whitespace after identifier or closing ] or }, or 
command =
    !begin !end "\\" identifier ("{" text* "}")*

environment =
    b:begin
        c:(text*)
    e:end

     {
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

char "character" =
    [a-z0-9._\-\*]i


comment =
    "%" (char / sp / nbsp)*
    { return null }

/* SPACES */

sp "whitespace" =
    [ \t]+
    { return " " }

nbsp "non-breakable whitespace" =
    "~"
    { return "&nbsp;" }

nl "newline" =
    [\n\r]
    { return " " }

break "paragraph break" =
    nl (sp* nl+)+    // two or more newlines, mixed with spaces
    { return "\n" }


EOF =
    !.
