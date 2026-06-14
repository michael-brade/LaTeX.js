import DefaultTheme from 'vitepress/theme'
import LaTeX from './components/LaTeX.vue'
import TeX from './components/TeX.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LaTeX', LaTeX)
    app.component('TeX', TeX)
  }
}
