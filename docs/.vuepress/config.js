const description = require('../../package.json').description

module.exports = {
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

    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/' },
            { text: 'Playground', link: '/playground.html' },
            { text: 'ChangeLog', link: 'https://github.com/michael-brade/LaTeX.js/releases'},
            { text: 'GitHub', link: 'https://github.com/michael-brade/LaTeX.js' },
        ],
        sidebar: 'auto',
        // sidebar: [
        //     '/',
        //     '/page-a',
        //     ['/page-b', 'Explicit link text'],
        //     {
        //         title: 'Group 1',
        //         collapsable: false,
        //         children: [
        //           '/'
        //         ]
        //       },
        //       {
        //         title: 'Group 2',
        //         children: [ /* ... */ ]
        //       }
        // ],
        sidebarDepth: 2,
        displayAllHeaders: true,
        activeHeaderLinks: true
    },

    markdown: {
        config: md => {
            md.set({
                html: true,
                breaks: true
            })
            //md.use(require('markdown-it-xxx'))
        }
    }
}