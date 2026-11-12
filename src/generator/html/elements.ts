import { Elements, type ElementKind } from "../elements.ts"


// create an HTML element with given classes
function createTag<Tag extends keyof HTMLElementTagNameMap>(
    tagName: Tag,
    classes?: string
): HTMLElementTagNameMap[Tag]
{
    const el = document.createElement(tagName);
    if (classes)
        el.setAttribute("class", classes);

    return el;
}


/**
 * The HtmlElementFactory type is needed for typing `HtmlElements`.
 * a tag name, or a factory creating the (empty) element */
export type HtmlElementFactory = string | (() => HTMLElement)


/**
 * The mapping of the generic element kinds to HTML: a tag name or an element factory.
 * Every ElementKind has to be mapped, checked by `satisfies`.
 */
export const HtmlElements = {
    // generic elements

    [Elements.inline]           : "span",
    [Elements.block]            : "div",


    // sectioning

    [Elements.part]             : "part",
    [Elements.chapter]          : "h1",
    [Elements.section]          : "h2",
    [Elements.subsection]       : "h3",
    [Elements.subsubsection]    : "h4",
    [Elements.paragraph]        : "h5",
    [Elements.subparagraph]     : "h6",


    // paragraphs

    [Elements.linebreak]        : "br",
    [Elements.par]  : "p",


    // lists

    [Elements.listitem]         : "li",
    [Elements.term]             : "dt",
    [Elements.description]      : "dd",


    // misc

    [Elements.verbatim]         : "pre",
    [Elements.verb]             : () => createTag("code", "tt"),


    // typographic elements

    [Elements.titlepage]        : () => createTag("div", "titlepage"),
    [Elements.title]            : () => createTag("div", "title"),
    [Elements.author]           : () => createTag("div", "author"),
    [Elements.date]             : () => createTag("div", "date"),

    [Elements.abstract]         : () => createTag("div", "abstract"),


    [Elements.list]             : () => createTag("div", "list"),

    [Elements.unorderedList]    : () => createTag("ul", "list"),
    [Elements.orderedList]      : () => createTag("ol", "list"),
    [Elements.descriptionList]  : () => createTag("dl", "list"),

    [Elements.itemlabel]        : () => createTag("span", "itemlabel"),

    [Elements.quote]            : () => createTag("div", "list quote"),
    [Elements.quotation]        : () => createTag("div", "list quotation"),
    [Elements.verse]            : () => createTag("div", "list verse"),
} satisfies Record<ElementKind, HtmlElementFactory>


/**
 * HTML element factories that need arguments or are only used internally by the HtmlGenerator;
 * these are not part of the generic ElementKinds, the Generator offers dedicated create*() methods.
 */
export const HtmlFactories = {
    multicols       : (c: number) => () => {
                        const el = createTag("div", "multicols");
                        el.setAttribute("style", "column-count:" + c);
                        return el;
                    },

    anchor          : (id: string) => () => {
                        const el = createTag("a");
                        el.id = id;
                        return el;
                    },

    link            : (url?: string) => () => {
                        const el = createTag("a");
                        if (url)
                            el.setAttribute("href", url);

                        return el;
                    },

    image           : (width: number, height: number, url: string) => () => {
                        const el = createTag("img");
                        el.src = url;
                        el.height = height;
                        el.width = width;
                        return el;
                    },

    marginPar       : (margin: string) => () => createTag("div", margin),

    picture         : () => createTag("span", "picture"),
    pictureCanvas   : () => createTag("span", "picture-canvas"),
} satisfies Record<string, HtmlElementFactory | ((...args: any[]) => HtmlElementFactory)>
