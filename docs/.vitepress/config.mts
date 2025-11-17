import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'url'
import path from 'path'
import string from 'vite-plugin-string'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'LaTeX.js',
  description: 'A LaTeX parser written in JavaScript.',
  
  outDir: '../website', 

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
    ],
  },

  // Enable markdown line breaks
  markdown: {
    breaks: true
  },
  
  // Vite-specific configuration
  vite: {
    plugins: [
      // Plugin to import .tex files as strings
      string({
        include: '**/*.tex',
      })
    ],
    resolve: {
      alias: {
        // Alias to find theme components
        '@theme/components': path.resolve(__dirname, './theme/components')
      }
    }
  }
})