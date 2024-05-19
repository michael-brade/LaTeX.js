// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'

import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import tex from './components/TeX.vue'
import latex from './components/LaTeX.vue'

// import './style.css'

export default {

    extends: DefaultTheme,

    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            // https://vitepress.dev/guide/extending-default-theme#layout-slots
        })
    },

    enhanceApp({ app, router, siteData }) {
        // register your custom global components
        app.component('tex', tex)
        app.component('TeX', tex)
        app.component('latex', latex)
        app.component('LaTeX', latex)
    }

} satisfies Theme
