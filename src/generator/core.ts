import type { LocationRange } from "peggy"

import type { Options } from "../options.ts"


/**
 * Root of the generator class hierarchy: the infrastructure every mixin relies on,
 * namely options, error reporting, source location, unique ids, and the root of the
 * reset() chain.
 *
 * The Generator itself is composed of this core plus the mixins, see generator.ts.
 */
export abstract class Core
{
    _options: Options


    constructor(options: Options)
    {
        this._options = options
    }

    reset(): void
    {
    }


    get options(): Options
    {
        return this._options
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


    _locationFn = (): LocationRange => {
        this.error("location function not set!");
    }

    public setLocationFn(fn: () => LocationRange): void
    {
        this._locationFn = fn;
    }

    public location(): LocationRange
    {
        return this._locationFn();
    }
}
