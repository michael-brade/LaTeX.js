<template>
  <DefaultTheme.Layout>
    <template #navbar-brand>
      <a href="/" class="navbar-brand-link">
        <img
          vPreload
          class="logo"
          src="/img/latexjs.png"
          alt="LaTeX.js Logo"
        />
        <LaTeX />.js
      </a>
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import LaTeX from './components/LaTeX.vue'
</script>

<style scoped>
/* Style to match old home-link */
.navbar-brand-link {
  display: flex;
  align-items: center;
  font-family: 'Liberation Serif', serif;
  font-size: 1.5rem;
  font-weight: 500;
}
.logo {
  height: 2rem;
  padding-bottom: 0.2rem;
  vertical-align: middle;
  margin-right: 0.8rem;
}
</style>