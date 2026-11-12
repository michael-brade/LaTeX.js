import
    './latex.ltx.ls': { LaTeX }

Macros = LaTeX


export class Generator

    # initialize only in CTOR, otherwise the objects end up in the prototype
    _options: null

    reset: !->
        # do this after creating the sectioning counters because \thepart etc. are already predefined
        @_macros = new Macros @, @_options.CustomMacros
