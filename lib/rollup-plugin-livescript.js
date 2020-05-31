import livescript from 'livescript'
import lexer from 'livescript/lib/lexer'
import Compiler from 'livescript-compiler/lib/livescript/Compiler'

// import transformAsync from 'livescript-transform-implicit-async/lib/plugin'
import transformESM from 'livescript-transform-esm/lib/plugin'
// import transformOC from 'livescript-transform-object-create/lib/plugin'

const { createFilter } = require('@rollup/pluginutils')
const { extname } = require('path')




export default (options = {}) => ({
    name: 'transpile-livescript',

    transform(code, id) {

        livescript.lexer = lexer

        const compiler = Compiler.__default__.create({ livescript: livescript })

        // transformAsync.__default__.install(compiler, {})
        transformESM.__default__.install(compiler, {})
        // transformOC.__default__.install(compiler, {})

        options = {
            bare: true,
            // header: true,
            header: false,
            const: false,
            json: false,
            warn: true,
            map: 'linked',
            sourceMap: true,
            extensions: ['.ls'],
            // filename: path,
            ...options
        }

        const filter = createFilter(options.include, options.exclude)

        if (!filter(id) || options.extensions.indexOf(extname(id)) === -1) {
            return null
        } else {
            options = { filename: id, outputFilename: id.replace(/\.ls$/,'.js'), ...options }
            const output = compiler.compile(code, options)
            // console.log("##### file ", id)
            // console.log(output.code)
            // console.log("##### end file ", id)
            return {
                code: output.code,
                map: output.map.toString()
            }
        }
    }
})
