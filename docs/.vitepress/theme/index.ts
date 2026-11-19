import type { EnhanceAppContext } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import Layout from './Layout.vue'
import LaTeX from '@theme/components/LaTeX.vue'
import TeX from '@theme/components/TeX.vue'

import './style.css'

export default {
    extends: DefaultTheme,
    Layout,

    enhanceApp({ app }: EnhanceAppContext) {
        app.component('LaTeX', LaTeX)
        app.component('latex', LaTeX)
        app.component('TeX', TeX)
        app.component('tex', TeX)
    }
}
