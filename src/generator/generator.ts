import type { MacroManager } from "../macro-manager.ts"

/**
 * Base class of a generator. A html generator would be a concrete generator.
 *
 * The generator class hierarchy holds the document state.
 */
export abstract class Generator
{
    _manager: MacroManager

    title?: string
    author?: string
    date?: string

    /** once \maketitle is called, title is set as documentTitle */
    documentTitle: string = "untitled"


    constructor(manager: MacroManager)
    {
        this._manager = manager
    }

    reset(): void
    {
        this.documentTitle = "untitled"
        this.title = this.author = this.date = undefined
    }


    // set the title of the document, usually called by the \maketitle macro
    setTitle(title: Node): void
    {
        this.documentTitle = title.textContent ? title.textContent : "untitled"
    }


    // TODO implement here? used by mixins...
    private createText(text: string | String): any {}
    private addAttributes(attr: any): any {}



    /// macro access

    hasMacro(name: string): boolean
    {
        return !!this._manager.hasMacro(name)
    }

    // "execute" (expand) a macro
    macro(name: string, ...args: any[]): any[]
    {
        const macroFn = this._manager.macroFn(name);
        if (!macroFn)
            this.error(`no such macro: \\${name}`);

        return macroFn(...args)
            // the macroFn returns an array -> filter undefined elements
            .filter((x: any) => x != undefined)
            .map((x: any) => {
                // if an element of the macro's result is a string, create text
                if (typeof x === 'string' || x instanceof String)
                    return this.createText(x);

                // otherwise, add the current attributes to the node
                return this.addAttributes(x);
            });
    }


    //// error handling

    _errorFn = (e: string): never => {
        console.error(e);
        throw new Error(e);
    }

    public setErrorFn(fn: (msg: string) => never): void
    {
        this._errorFn = fn;
    }

    // report an error
    public error(e: string): never
    {
        this._errorFn(e);
        throw new Error("illegal error function: it unexpectedly returned");
    }


    _locationFn = (): void => {
        this.error("location function not set!");
    }

    public setLocationFn(fn: () => void): void
    {
        this._locationFn = fn;
    }

    public location(): void
    {
        this._locationFn();
    }
}
