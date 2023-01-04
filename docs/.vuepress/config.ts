import { defaultTheme } from '@vuepress/theme-default'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { getDirname, path } from '@vuepress/utils'

// import { defineConfig } from '@vuepress/config'
import { defineUserConfig } from '@vuepress/cli'

// import { webpackBundler } from '@vuepress/bundler-webpack'
import { viteBundler } from '@vuepress/bundler-vite'

import { description } from '../../package.json'
import assets from './assets'

import { string } from 'rollup-plugin-string'



const __dirname = getDirname(import.meta.url)


// export default {
// export default defineConfig({
export default defineUserConfig({

    title: 'LaTeX.js',
    description: description,

    dest: 'website',

    head: [
        ['link', {
            rel: 'icon',
            href: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAwAAAAEAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAUAAAADAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAIAAAABAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAACAAAACgAAAAYAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAsAAAAIAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAMAAAAJAAAACAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/SUnC/wAAAAgAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAQAAAAQAAAAHAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAEAAAABQAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAABAAAABAAAAAMAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAMAAAACAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAEAAAACAAAAAAAAAAEAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAAAAAAAAAAAYAAAAFwAAABYAAAATAAAAEQAAAA0AAAALAAAACQAAAAcAAAADAAAAAwAAAAMAAAABAAAAAAAAAAAAAAAA8BMAAP/5AADxiAAA5+AAAOfgAADn4AAA5+AAAOfgAACP8AAA5+AAAOfgAADn4AAA5+QAAOfhAABxiwAAAAcAAA==',
            type: 'image/x-icon'
        }]
    ],

    theme: defaultTheme({
        logo: '/img/latexjs.png',

        navbar: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/usage.html' },
            { text: 'Playground', link: '/playground.html', target:'_self', rel: '' },
            { text: 'ChangeLog', link: 'https://github.com/michael-brade/LaTeX.js/releases'},
            { text: 'GitHub', link: 'https://github.com/michael-brade/LaTeX.js' },
        ],
        sidebar: [
            '',                 // Home
            'usage',
            'api',
            'extending',
            'limitations'
        ],
        sidebarDepth: 1,

        // search: false,
        // displayAllHeaders: true,
        // activeHeaderLinks: true
    }),

    markdown: {
        // extendMarkdown: md => {
        //     md.set({ breaks: true })
        //     //md.use(require('markdown-it-xxx'))
        // }

        breaks: true
    },

    plugins: [
        require('./assets'),

        registerComponentsPlugin({
            componentsDir: path.resolve(__dirname, './components')
        }),
    ],

    bundler: viteBundler({
        viteOptions: {
            appType: 'spa',
            // mode: 'development' / 'production',
            // plugins: ,
            build: {
                rollupOptions: {
                    plugins: [
                        string({
                            // Required to be specified
                            include: "./docs/showcase.tex",

                            // Undefined by default
                            // exclude: ["**/index.html"]
                        })
                    ]
                }
            }
        },
        vuePluginOptions: {
            customElement: true
        },
    })

    // bundler: webpackBundler({
    //     sass: { /* ... */ },

    //     configureWebpack: (config, isServer) => {
    //         config.externals = {
    //             'svgdom': 'commonjs svgdom'
    //         }

    //         config.output.hashFunction = 'xxhash64'
    //     },
    // })
})
