---
title: LaTeX.js Live Playground
description: This is the LaTeX.js editor with live preview.
layout: page
sidebar: false
aside: false
pageClass: playground-page
---

<div id="playground-page">
  <LtxPlayground />
</div>

<script setup>
import { defineClientComponent } from 'vitepress'

// rendered in the browser only, not server-rendered by `vitepress build`: Vue creates the preview iframe with its
// load listener, and the playground (CodeMirror, LaTeX.js) stays out of the server bundle
const LtxPlayground = defineClientComponent(() => import('./components/LtxPlayground.vue'))
</script>

<style>
/* fill the rest of the window below the navbar, without a page scrollbar */
#playground-page {
  height: calc(100vh - var(--vp-nav-height) - var(--vp-layout-top-height, 0px));
  margin: 0;
}
</style>
