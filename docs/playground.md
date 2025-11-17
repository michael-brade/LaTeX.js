---
layout: false     # no default theme: full-page playground
---

<div id="playground-page">
  <LtxPlayground />
</div>

<script setup>
import LtxPlayground from './.vitepress/theme/components/LtxPlayground.vue'
</script>

<style>
#playground-page,
#playground-page > * {
  height: 100vh;
  margin: 0;
}
</style>
