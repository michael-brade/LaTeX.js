import path from 'node:path'

import { defineConfig } from 'vitepress'


// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'LaTeX.js',
    description: 'A LaTeX parser written in JavaScript.',

    outDir: '../website',
    // cacheDir: './.vitepress/cache',

    head: [
        ['link', {
            rel: 'icon',
            href: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAwAAAAEAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAUAAAADAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAIAAAABAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAACAAAACgAAAAYAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAgAAAAsAAAAIAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAMAAAAJAAAACAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/SUnC/wAAAAgAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAQAAAAQAAAAHAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAIAAAAEAAAABQAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASUnC/0lJwv8AAAABAAAABAAAAAMAAAAAAAAAAAAAAABJScL/SUnC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAElJwv9JScL/AAAAAAAAAAMAAAACAAAAAAAAAAAAAAAASUnC/0lJwv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJScL/SUnC/wAAAAEAAAACAAAAAAAAAAEAAAAAAAAAAAAAAABJScL/SUnC/0lJwv8AAAAAAAAAAElJwv9JScL/SUnC/wAAAAAAAAABAAAAAAAAAAAAAAAYAAAAFwAAABYAAAATAAAAEQAAAA0AAAALAAAACQAAAAcAAAADAAAAAwAAAAMAAAABAAAAAAAAAAAAAAAA8BMAAP/5AADxiAAA5+AAAOfgAADn4AAA5+AAAOfgAACP8AAA5+AAAOfgAADn4AAA5+QAAOfhAABxiwAAAAcAAA=='
        }],
        ['link', { rel: 'stylesheet', href: '/css/error.css' }],
        ['link', { rel: 'stylesheet', href: '/css/logos.css' }]
    ],

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/img/latexjs.png',
        siteTitle: false,   // the typeset LaTeX.js logo is rendered by theme/Layout.vue

        aside: true,

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/usage' },
            { text: 'Playground', link: '/playground' },
            { text: 'ChangeLog', link: 'https://github.com/michael-brade/LaTeX.js/releases' },
            { text: 'GitHub', link: 'https://github.com/michael-brade/LaTeX.js' },
        ],

        sidebar: [
            { text: 'Home', link: '/' },
            { text: 'Usage', link: '/usage' },
            { text: 'API', link: '/api' },
            { text: 'Extending', link: '/extending' },
            { text: 'Limitations', link: '/limitations' }
        ]
    },

    // Enable markdown line breaks
    markdown: {
        breaks: true,
        languageAlias: {
            mjs: 'js'
        }
    },

    // Vite-specific configuration
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    // additionalData: `
                    //     @import "@/scss/_variables.scss";
                    //     $injectedColor: orange;
                    // `
                }
            }
        },
        // so that hyphen (CommonJS) gets bundled for SSR (Node can't import its named exports)
        ssr: {
            noExternal: ['hyphen']
        },
        resolve: {
            alias: {
                // Alias to find theme components
                '@theme/components': path.resolve(import.meta.dirname, './theme/components')
            }
        }
    }
})
