/**
 * The generic kinds of elements that can be created with Generator.create(). Each concrete generator
 * maps every kind to its output format (e.g. HtmlElements).
 *
 * Usage: `Elements.block`, etc.
 *
 * Elements that need arguments get a dedicated create*() method instead (createLink, createImage, ...).
 *
 * This could be an enum, but enums are not erasable syntax (erasableSyntaxOnly in @tsconfig/node-ts),
 * so this is an object built from the list of kinds instead, mapping each kind to itself.
 *
 * Import Elements from generator.ts, which re-exports it. This module should be kept free of imports
 * so that it can't become part of an import cycle.
 */
const kinds = [
    // generic elements
    "inline", "block",

    // sectioning
    "part", "chapter", "section", "subsection", "subsubsection", "paragraph", "subparagraph",

    // paragraphs
    "par", "linebreak",

    // lists
    "list", "unorderedList", "orderedList", "descriptionList",
    "listitem", "itemlabel", "term", "description",
    "quote", "quotation", "verse",

    // title, abstract
    "titlepage", "title", "author", "date", "abstract",

    // verbatim
    "verb", "verbatim",
] as const


export type ElementKind = typeof kinds[number]

export const Elements: { readonly [K in ElementKind]: K } =
    Object.freeze(Object.fromEntries(kinds.map(k => [k, k]))) as { readonly [K in ElementKind]: K }


export function isElementKind(kind: unknown): kind is ElementKind
{
    return Object.hasOwn(Elements, kind as PropertyKey)
}
