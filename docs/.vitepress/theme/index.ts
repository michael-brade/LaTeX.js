import type { EnhanceAppContext, Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import Layout from '@theme/Layout.vue'
import LaTeX from '@theme/components/LaTeX.vue'
import TeX from '@theme/components/TeX.vue'

import './style.scss'


export default {
    extends: DefaultTheme,
    Layout: Layout,

    enhanceApp({ app }: EnhanceAppContext) {
        app.component('LaTeX', LaTeX)
        app.component('latex', LaTeX)
        app.component('TeX', TeX)
        app.component('tex', TeX)
    }
} satisfies Theme
