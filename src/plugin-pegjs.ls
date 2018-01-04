export {
    use: (config, options) !->
        # disable reportInfiniteRepetition, which is the last element
        if (name = config.passes.check.pop!.name) != "reportInfiniteRepetition"
            throw new Error "wrong check function removed: " + name
}
