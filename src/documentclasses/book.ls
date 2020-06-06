import
    './report': { Report }


# book in LaTeX has no abstract

export class Book extends Report

    # public static
    @css = "css/book.css"


    # CTOR
    (generator, options) ->
        super ...

        @[\@mainmatter] = true


    args = @args = Report.args

    args
     ..\part =          \
     ..\chapter =       <[ V s X o? g ]>

    \chapter            : (s, toc, ttl) -> [ @g.startsection \chapter, 0, (s or not @"@mainmatter"), toc, ttl ]


    args
     ..\frontmatter =   \
     ..\mainmatter =    \
     ..\backmatter =    <[ V ]>

    \frontmatter        :!-> @[\@mainmatter] = false
    \mainmatter         :!-> @[\@mainmatter] = true
    \backmatter         :!-> @[\@mainmatter] = false
