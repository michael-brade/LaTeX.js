import { Core } from "./core.ts"
import { MacroManagement } from "./macro-management.ts"
import { Groups } from "./groups.ts"
import { Counters } from "./counters.ts"
import { Lengths } from "./lengths.ts"
import { Attributes } from "./attributes.ts"
import { Primitives } from "./primitives.ts"
import { References } from "./references.ts"
import { DocumentInfo } from "./document-info.ts"

import type { Options } from "../options.ts"
import type { Length, Vector } from "../types.ts"


/**
 * The generic kinds of elements that can be created with Generator.create(). Each concrete generator
 * maps every kind to its output format (e.g. HtmlElements).
 *
 * Elements that need arguments get a dedicated create*() method instead (createLink, createImage, ...).
 */
export type ElementKind =
    // generic elements
    | "inline" | "block"
    // sectioning
    | "part" | "chapter" | "section" | "subsection" | "subsubsection" | "paragraph" | "subparagraph"
    // paragraphs
    | "par" | "linebreak"
    // lists
    | "list" | "unorderedList" | "orderedList" | "descriptionList"
    | "listitem" | "itemlabel" | "term" | "description"
    | "quote" | "quotation" | "verse"
    // title, abstract
    | "titlepage" | "title" | "author" | "date" | "abstract"
    // verbatim
    | "verb" | "verbatim"


/**
 * The generator: the contract between the parser (and the macros) and any concrete generator,
 * like HtmlGenerator, or a future TextGenerator or MarkdownGenerator.
 *
 * It is composed of the Core and the format-independent mixins, each handling one part of the
 * document state; a mixin may depend on the ones before it (e.g. Lengths needs Groups).
 *
 * Everything that depends on the output format is declared abstract here and has
 * to be implemented by a concrete generator.
 *
 * @typeParam TNode the type of the output nodes, e.g. DOM `Node` for HTML
 */
export abstract class Generator<TNode = unknown> extends
    DocumentInfo(
    References(
    Primitives(
    Attributes(
    Lengths(
    Counters(
    Groups(
    MacroManagement(
        Core
    ))))))))
{
    constructor(options: Options)
    {
        super(options)
        this._manager.setGenerator(this)
    }


    //// node creation

    /**
     * Create an element of the given kind.
     *
     * @param kind the generic kind of element
     * @param children the content of the element
     * @param classes additional (space separated) classes of the element;
     *                TODO: right now kind of HTML specific
     */
    abstract create(kind: ElementKind, children?: TNode | TNode[] | null, classes?: string): TNode


    // create a text node that has font attributes set and allows for hyphenation
    abstract override createText(t: string | String): TNode | undefined

    // create a pure text node without font attributes and no hyphenation
    abstract createVerbatim(t: string, ...rest: unknown[]): TNode | undefined

    // create a fragment; arguments may be Node(s) and/or arrays of Node(s)
    abstract override createFragment(...args: (TNode | TNode[])[]): TNode | undefined

    abstract createImage(width: number, height: number, url: string): TNode
    abstract createPicture(size: Vector, content: any, offset?: Vector): TNode

    abstract createDocument(fs: unknown): void


    abstract createVSpaceSkip(skip: "smallskip" | "medskip" | "bigskip"): TNode
    abstract createVSpaceSkipInline(skip: "smallskip" | "medskip" | "bigskip"): TNode
    abstract createVSpace(length: Length): TNode
    abstract createVSpaceInline(length: Length): TNode
    abstract createBreakSpace(length: Length): TNode

    abstract parseMath(math: string, display: boolean): TNode
    abstract theLength(id: string): TNode
}
