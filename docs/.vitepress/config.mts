import { defineConfig, defineConfigWithTheme } from 'vitepress'
// import type { ThemeConfig } from 'your-theme'

import { description } from '../../package.json'


// https://vitepress.dev/reference/site-config
export default defineConfig({
    //export default defineConfigWithTheme<ThemeConfig>({

    lang: "en-US",

    title: "LaTeX.js",
    description: description,

    head: [
        ['link', {
            rel: 'icon',
            href: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAwAAAAEAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAUAAAADAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAIAAAABAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAACAAAACgAAAAYAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAsAAAAIAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAMAAAAJAAAACAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/SUnC/wAAAAgAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAQAAAAQAAAAHAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAEAAAABQAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAABAAAABAAAAAMAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAMAAAACAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAEAAAACAAAAAAAAAAEAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAAAAAAAAAAAYAAAAFwAAABYAAAATAAAAEQAAAA0AAAALAAAACQAAAAcAAAADAAAAAwAAAAMAAAABAAAAAAAAAAAAAAAA8BMAAP/5AADxiAAA5+AAAOfgAADn4AAA5+AAAOfgAACP8AAA5+AAAOfgAADn4AAA5+QAAOfhAABxiwAAAAcAAA==',
            type: 'image/x-icon'
        }]
    ],

    base: '/',

    srcDir: '.',                  // project root (docs)
    outDir: 'website',
    cacheDir: '.vitepress/cache',

    assetsDir: 'assets',          // relative to outDir

    // Type is `DefaultTheme.Config` (or `ThemeConfig`)
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/img/latexjs.png',
        // logo: { src: '/img/latexjs.svg', width: 24, height: 24 },

        nav: [
            // { text: 'Home', link: '/' },
            { text: 'Guide', link: '/usage.html' },
            { text: 'Playground', link: '/playground.html', target:'_self', rel: '' },
            { text: 'ChangeLog', link: 'https://github.com/michael-brade/LaTeX.js/releases'},
            { text: 'GitHub', link: 'https://github.com/michael-brade/LaTeX.js' },
        ],

        sidebar: [
            { text: 'Home', link: '/' },
            { text: 'Usage', link: 'usage.html' },
            { text: 'API', link: 'api.html' },
            { text: 'Extending LaTeX.js', link: 'extending.html' },
            //     items: [
            //       { text: 'Markdown Examples', link: '/markdown-examples' },
            //       { text: 'Runtime API Examples', link: '/api-examples' }
            //     ]
            { text: 'Limitations', link: 'limitations.html' }
        ],

        search: {
            provider: 'local',
            options: {

            }
        },

        // displayAllHeaders: true,
        // activeHeaderLinks: true

        // socialLinks: [
        //     { icon: 'github', link: 'https://github.com/michael-brade/LaTeX.js' }
        // ],

        lastUpdated: undefined,

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2015-2024 Michael Brade'
        }
    },

    markdown: {
        // extendMarkdown: md => {
        //     md.set({ breaks: true })
        //     //md.use(require('markdown-it-xxx'))
        // }

        breaks: true
    },

    vue: {

    },

    vite: {
        clearScreen: false,
        build: {
            assetsInlineLimit: 4096
        }
    }
})


/*
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import { getDirname, path } from '@vuepress/utils'

import { viteBundler } from '@vuepress/bundler-vite'

import assets from './assets'

import { string } from 'rollup-plugin-string'



const __dirname = getDirname(import.meta.url)

{


    dest: 'website',


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
                            // exclude: ["** /index.html"]
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
    //     sass: { ...  },

    //     configureWebpack: (config, isServer) => {
    //         config.externals = {
    //             'svgdom': 'commonjs svgdom'
    //         }

    //         config.output.hashFunction = 'xxhash64'
    //     },
    // })
}
*/