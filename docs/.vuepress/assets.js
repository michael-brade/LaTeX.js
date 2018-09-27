const path = require('path')

module.exports = (options, ctx) => {
  const styleAssetsPath = path.resolve(process.cwd(), 'dist/css')
  const fontAssetsPath = path.resolve(process.cwd(), 'dist/fonts')
  const jsAssetsPath = path.resolve(process.cwd(), 'dist/js')

  return {
      // For development
      enhanceDevServer (app) {
        const mount = require('koa-mount')
        const serveStatic = require('koa-static')

        app.use(mount(path.join(ctx.base, 'css'), serveStatic(styleAssetsPath)))
        app.use(mount(path.join(ctx.base, 'fonts'), serveStatic(fontAssetsPath)))
        app.use(mount(path.join(ctx.base, 'js'), serveStatic(jsAssetsPath)))
      },

      // For production
      async generated () {
        const { fs } = require('@vuepress/shared-utils')

        await fs.copy(styleAssetsPath, path.resolve(ctx.outDir, 'css'))
        await fs.copy(fontAssetsPath, path.resolve(ctx.outDir, 'fonts'))
        await fs.copy(jsAssetsPath, path.resolve(ctx.outDir, 'js'))
      }
  }
}