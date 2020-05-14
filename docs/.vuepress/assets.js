const path = require('path')

module.exports = (options, ctx) => {
    const styleAssetsPath = 'dist/css'
    const fontAssetsPath = 'dist/fonts'
    const jsAssetsPath = 'dist/js'
    const editorAssets = [
        'node_modules/codemirror/lib/codemirror.js',
        'node_modules/codemirror/mode/stex/stex.js',
        'node_modules/split-grid/dist/split-grid.min.js'
    ]

    return {
        // For development
        beforeDevServer(app, server) {
            const express = require('express')
            // const serveStatic = require('serve-static')
            const serveStatic = express.static

            // path.resolve uses cwd if argument is relative
            app.use('/css', serveStatic(path.resolve(styleAssetsPath)))
            app.use('/fonts', serveStatic(path.resolve(fontAssetsPath)))
            app.use('/js', serveStatic(path.resolve(jsAssetsPath)))

            for (var file of editorAssets)
                app.use('/js', serveStatic(path.resolve(path.dirname(file))))
        },

        // For production
        async generated() {
            const { fs } = require('@vuepress/shared-utils')

            await fs.copy(path.resolve(styleAssetsPath), path.resolve(ctx.outDir, 'css'))
            await fs.copy(path.resolve(fontAssetsPath), path.resolve(ctx.outDir, 'fonts'))
            await fs.copy(path.resolve(jsAssetsPath), path.resolve(ctx.outDir, 'js'))

            for (var file of editorAssets)
                await fs.copy(path.resolve(file), path.resolve(ctx.outDir, 'js', path.basename(file)))
        }
    }
}