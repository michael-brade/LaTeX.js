import DefaultTheme from 'vitepress/theme'
import LaTeX from './components/LaTeX.vue'
import TeX from './components/TeX.vue'
import LtxPlayground from './components/LtxPlayground.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('LaTeX', LaTeX)
    app.component('TeX', TeX)
    app.component('LtxPlayground', LtxPlayground)
  }
}
