import DefaultTheme from 'vitepress/theme'
import LaTeX from '@theme/components/LaTeX.vue'
import TeX from '@theme/components/TeX.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LaTeX', LaTeX)
    app.component('TeX', TeX)
  }
}
