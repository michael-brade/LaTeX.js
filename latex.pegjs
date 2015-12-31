/* A LaTeX grammar and parser written using PEG.js */

{
    var envs = ["itemize", "description"];

    var html = ""; // maybe use jQuery and build a dom


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
    d:paragraph+

    {
    	//return d
    	return html
    }

paragraph =
    text+ (break / EOF)

text =
    inline /
    environment /
    comment+

inline =
	t:char+ 		{ html += t.join("") } /
    c:command		{ html += " TODO:cmd " } /
    s:(sp / nbsp)	{ html += s } /
    !break n:nl		{ html += n }

command =
	!begin !end "\\" identifier ("{" inline* "}")*

environment =
    b:begin
    	c:(paragraph* text*)
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
    [ \t]
    { return " " }

nbsp "non-breakable whitespace" =
    "~"
    { return "&nbsp;" }

nl "newline" =
    [\n\r]
    { return " " }

break "paragraph break" =
    nl nl+	// two or more newlines


EOF =
	!.
