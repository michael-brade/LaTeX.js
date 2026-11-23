---
layout: page
sidebar: false
aside: false
pageClass: ltx-home-page
---

<main class="ltx-home" aria-labelledby="main-title">

<header class="hero">
  <h1 id="main-title">
      <img src="/img/latexjs.svg" alt="LaTeX.js"> <latex/>.js
  </h1>

  <p class="description">JavaScript <latex/> to HTML5 translator</p>

  <p class="action">
    <a href="/usage" class="action-button">Documentation →</a>
    &nbsp;
    <a href="/playground" class="action-button">Playground →</a>
  </p>
</header>

<div class="features">
  <div class="feature">
    <h2><span class="icon icon-typescript" aria-hidden="true"></span> 100% JavaScript</h2>
    <p><latex/>.js is written in TypeScript, compiles to 100% JavaScript, and runs in the browser. No external dependencies need to be loaded.</p>
  </div>

  <div class="feature">
    <h2><span class="icon icon-cli" aria-hidden="true"></span> CLI</h2>
    <p>The <code>latex.js</code> binary allows to translate <latex/> files in the console. It depends on a DOM implementation (svgdom in this case).</p>
  </div>

  <div class="feature">
    <h2><span class="icon icon-compatible" aria-hidden="true"></span> Compatibility</h2>
    <p><latex/>.js produces almost the exact same output you would get with <latex/>—except where impossible: glue cannot
    be translated to HTML, and sometimes cannot even be interpreted in the context of HTML.</p>
  </div>

  <div class="feature">
    <h2><span class="icon icon-extend" aria-hidden="true"></span> Extensibility</h2>
    <p>New macros can easily be added in JavaScript. Very often it is much easier to implement a piece of functionality
    in JavaScript and CSS than it is in <latex/>.</p>
  </div>

  <div class="feature">
    <h2><span class="icon icon-speed" aria-hidden="true"></span> Speed</h2>
    <p><latex/>.js only needs one pass over the document instead of several. References can be filled in by remembering
    and later modifying the relevant part of the DOM tree.</p>
  </div>

  <div class="feature">
    <h2><span class="icon icon-open_source" aria-hidden="true"></span> Open Source</h2>
    <p>Of course, <latex/>.js is completely Open Source. You can find the code on
    <a href="https://github.com/michael-brade/LaTeX.js">GitHub</a>.</p>
  </div>
</div>

<div class="footer">MIT Licensed | Copyright © 2017-2026 Michael Brade</div>

</main>
