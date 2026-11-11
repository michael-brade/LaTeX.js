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
import type { Length } from "../types.ts"


/**
 * The generator: the contract between the parser (and the macros) and any concrete generator,
 * like HtmlGenerator, or a future TextGenerator or MarkdownGenerator.
 *
 * It is composed of the Core and the format-independent mixins, each handling one part of the
 * document state; a mixin may depend on the ones before it (e.g. Lengths needs Groups). Everything
 * that depends on the output format is declared abstract here.
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


    //// output-specific element kinds (passed to create())

    abstract readonly linebreak: unknown
    abstract readonly par: unknown
    abstract readonly verb: unknown
    abstract readonly list: unknown
    abstract readonly title: unknown
    abstract readonly author: unknown
    abstract readonly date: unknown


    //// node creation

    abstract override createText(t: string | String): TNode | undefined
    abstract createVerbatim(t: string, ...rest: unknown[]): TNode | undefined
    abstract createFragment(...args: (TNode | TNode[])[]): TNode | undefined
    abstract create(type: unknown, children?: TNode | TNode[] | null, classes?: string): TNode
    abstract createDocument(fs: unknown): void

    abstract createVSpaceSkip(skip: "smallskip" | "medskip" | "bigskip"): TNode
    abstract createVSpaceSkipInline(skip: "smallskip" | "medskip" | "bigskip"): TNode
    abstract createVSpace(length: Length): TNode
    abstract createVSpaceInline(length: Length): TNode
    abstract createBreakSpace(length: Length): TNode

    abstract parseMath(math: string, display: boolean): TNode
    abstract theLength(id: string): TNode
}
