import { type Constructor } from "../../lib/mixin.ts"

import { Core } from "./core.ts"
import type { PackageOpts } from "../options.ts"


export function DocumentInfo<TBase extends Constructor<Core>>(Base: TBase)
{
    /**
     * This mixin is part of the generator and holds the document metadata: document class,
     * title, author, date.
     */
    abstract class DocumentInfoMixin extends Base
    {
        // first the name of the document class to load;
        // then, after the document class has been loaded, latex.ltx stores the options here
        // for later use when loading other packages
        documentClass: string | { options: PackageOpts } = "article"

        // set by \title, \author, \date; these are output nodes, used by \maketitle
        _title?: unknown
        _author?: unknown
        _date?: unknown

        /** once \maketitle is called, the title is set as documentTitle (plain text) */
        documentTitle: string = "untitled"


        override reset(): void
        {
            super.reset()

            this.documentClass = "article"
            this.documentTitle = "untitled"
            this._title = this._author = this._date = undefined
        }


        // output-specific: the plain text content of an output node
        abstract plainText(node: unknown): string

        // set the title of the document, usually called by the \maketitle macro
        setTitle(title: unknown): void
        {
            this.documentTitle = this.plainText(title) || "untitled"
        }
    }

    return DocumentInfoMixin
}
