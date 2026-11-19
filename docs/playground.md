---
layout: page      # default theme with navbar, but no sidebar, aside or doc styling
sidebar: false
aside: false
pageClass: playground-page
title: Live Playground
---

<div id="playground-page">
  <LtxPlayground />
</div>

<script setup>
import LtxPlayground from './components/LtxPlayground.vue'
</script>

<style>
/* fill the rest of the window below the navbar, without a page scrollbar */
#playground-page {
  height: calc(100vh - var(--vp-nav-height) - var(--vp-layout-top-height, 0px));
  margin: 0;
}
</style>
