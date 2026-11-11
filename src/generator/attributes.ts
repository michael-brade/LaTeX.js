import type Stack from "../../lib/stack.ts"
import { type Constructor } from "../../lib/mixin.ts"

import { Generator } from "./generator.ts"
import type { StackItem } from "./groups.ts"


/**
 * Inline (font) attributes of a group; in HTML, those become CSS classes
 */
export interface TextAttributes
{
    fontFamily?: string
    fontWeight?: string
    fontShape?: string
    fontSize?: string
    textDecoration?: string
}

/**
 * Attributes that are not inherited; set per group level where they are changed
 */
export type Alignment = string | null


type GroupedGenerator = Generator & { _stack: Stack<StackItem> }


export function Attributes<TGenerator extends Constructor<GroupedGenerator>>(GeneratorBase: TGenerator)
{
    /**
     * This mixin is part of the generator and handles the text attributes (font, alignment) of the
     * current group, as well as the paragraph continuation state.
     */
    abstract class AttributesMixin extends GeneratorBase
    {
        // source offset after which no new paragraph should be started (no parindent/parskip),
        // or false if not continuing
        _continue: number | false = false


        override reset(): void
        {
            super.reset()
            this._continue = false
        }


        /// paragraph continuation

        continue(): void
        {
            this._continue = this.location().end.offset;
        }

        break(): void
        {
            // only record the break if it came from a position AFTER the continue
            if (this._continue !== false && this.location().end.offset > this._continue)
                this._continue = false;
        }


        /// alignment

        setAlignment(align: Alignment): void
        {
            this._stack.top.align = align;
        }

        alignment(): Alignment
        {
            return this._stack.top.align;
        }


        /// font attributes

        setFontFamily(family: string): void
        {
            this._stack.top.attrs.fontFamily = family;
        }

        setFontWeight(weight: string): void
        {
            this._stack.top.attrs.fontWeight = weight;
        }

        setFontShape(shape: string): void
        {
            // \em toggles between italic and upright
            if (shape === "em")
                shape = this._activeAttributeValue("fontShape") === "it" ? "up" : "it";

            this._stack.top.attrs.fontShape = shape;
        }

        setFontSize(size: string): void
        {
            this._stack.top.attrs.fontSize = size;
        }

        setTextDecoration(decoration: string): void
        {
            this._stack.top.attrs.textDecoration = decoration;
        }


        // get all inline attributes of the current group as a space-separated string
        _inlineAttributes(): string
        {
            const cur = this._stack.top.attrs;
            return [cur.fontFamily, cur.fontWeight, cur.fontShape, cur.fontSize, cur.textDecoration]
                .join(' ').replace(/\s+/g, ' ').trim();
        }

        // get the currently active value for a specific attribute, also taking into account inheritance
        // from parent groups; returns undefined if the attribute was never set
        _activeAttributeValue(attr: keyof TextAttributes): string | undefined
        {
            // the stack iterates from top to bottom: the first value found is the active one
            for (const level of this._stack)
                if (level.attrs[attr])
                    return level.attrs[attr];

            return undefined;
        }
    }

    return AttributesMixin
}

export type AttributesAPI = InstanceType<ReturnType<typeof Attributes>>
