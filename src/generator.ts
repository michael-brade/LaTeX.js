import type { MacroManager } from "./macro-manager.ts"

/**
 * Base class of a generator. A html generator would be a concrete generator.
 *
 * The generator class hierarchy holds the document state.
 */
export abstract class Generator
{
    #manager: MacroManager

    title?: string
    author?: string
    date?: string

    /** once \maketitle is called, title is set as documentTitle */
    documentTitle: string = "untitled"


    constructor(manager: MacroManager)
    {
        this.#manager = manager
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
    g = { arabic: (val: number) => {} };
    private createText(text: string | String): any {}
    private addAttributes(attr: any): any {}



    /// macro access

    hasMacro(name: string): boolean
    {
        return !!this.#manager.hasMacro(name)
    }

    // "execute" (expand) a macro
    macro(name: string, ...args: any[]): any[] | undefined
    {
        // TODO symbols static element
        if (symbols.has(name))
            return [this.createText(symbols.get(name)!)];


        const macroFn = this.#manager.macroFn(name);
        if (!macroFn)
            return undefined;

        const result = macroFn(...args);

        return result
            ?.filter((x: any) => x != undefined)
            .map((x: any) => {
                if (typeof x === 'string' || x instanceof String)
                    return this.createText(x);

                return this.addAttributes(x);
            });
    }


    //// error handling

    #errorFn = (e: string): never =>
    {
        console.error(e);
        throw new Error(e);
    }

    public setErrorFn(fn: (msg: string) => never): void
    {
        this.#errorFn = fn;
    }

    // report an error
    public error(e: string): never
    {
        this.#errorFn(e);
        throw new Error("illegal error function: it unexpectedly returned");
    }


    #locationFn = (): void => {
        this.error("location function not set!");
    }

    public setLocationFn(fn: () => void): void
    {
        this.#locationFn = fn;
    }

    public location(): void
    {
        this.#locationFn();
    }
}
