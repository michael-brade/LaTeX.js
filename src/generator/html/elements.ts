// create an HTML element with given classes
function createTag(tagName: string, classes?: string): HTMLElement
{
    const el = document.createElement(tagName);
    if (classes)
        el.setAttribute("class", classes);

    return el;
}



export const HtmlElements =
{
    // generic elements

    inline          : "span",
    block           : "div",


    // sectioning

    part            : "part",
    chapter         : "h1",
    section         : "h2",
    subsection      : "h3",
    subsubsection   : "h4",
    paragraph       : "h5",
    subparagraph    : "h6",


    // paragraphs

    linebreak       : "br",
    par             : "p",


    // lists

    listitem        : "li",
    term            : "dt",
    description     : "dd",


    // misc

    verbatim        : "pre",

    img             : "img",



    // typographic elements
    titlepage           : () => createTag(HtmlElements.block, "titlepage"),
    title               : () => createTag(HtmlElements.block, "title"),
    author              : () => createTag(HtmlElements.block, "author"),
    date                : () => createTag(HtmlElements.block, "date"),

    abstract            : () => createTag(HtmlElements.block, "abstract"),


    list                : () => createTag(HtmlElements.block, "list"),

    unorderedList       : () => createTag("ul", "list"),
    orderedList         : () => createTag("ol", "list"),
    descriptionList     : () => createTag("dl", "list"),


    itemlabel           : () => createTag(HtmlElements.inline, "itemlabel"),

    quote               : () => createTag(HtmlElements.block, "list quote"),
    quotation           : () => createTag(HtmlElements.block, "list quotation"),
    verse               : () => createTag(HtmlElements.block, "list verse"),

    multicols           : (c: any) => () => {
                            const el = createTag(HtmlElements.block, "multicols");
                            el.setAttribute("style", "column-count:" + c);
                            return el;
                        },

    anchor              : (id: string) => () => {
                            const el = document.createElement("a");
                            if (id !== undefined && id !== null)
                                el.id = id;

                            return el;
                        },

    link                : (url: string) => () => {
                            const el = document.createElement("a");
                            if (url)
                                el.setAttribute("href", url);

                            return el;
                        },

    verb                : () => createTag("code", "tt"),

    image               : (width: number, height: number, url: string) => () => {
                            const el = createTag(HtmlElements.img) as HTMLImageElement;
                            el.src = url;
                            el.height = height;
                            el.width = width;
                            return el;
                        },

    marginPar           : (margin: string) => () => createTag(HtmlElements.block, margin),

    picture             : () => createTag(HtmlElements.inline, "picture"),
    pictureCanvas       : () => createTag(HtmlElements.inline, "picture-canvas")
}
