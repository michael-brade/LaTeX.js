<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import LaTeX from '@theme/components/LaTeX.vue'
</script>


<template>
  <DefaultTheme.Layout>
    <template #nav-bar-title-after>
      <span class="site-title"><LaTeX />.js</span>
    </template>
  </DefaultTheme.Layout>
</template>


<style scoped>
.site-title {
  font-family: 'Liberation Serif', serif;
  font-size: 1.5rem;
  font-weight: 500;
}
</style>
