---
home: true
navbar: false
footer: MIT Licensed | Copyright © 2017-2020 Michael Brade
---
<header class="hero">
  <h1 id="main-title">
      <img src="/img/latexjs.png" alt="LaTeX.js"> <latex/>.js
  </h1>

  <p class="description">JavaScript <latex/> to HTML5 translator</p>

  <p class="action">
    <a href="/usage.html" class="nav-link action-button">Documentation →</a>
    &nbsp;
    <a href="/playground.html" class="nav-link action-button">Playground →</a>
  </p>
</header>

<div class="features">
  <div class="feature">
    <h2>100% JavaScript</h2>
    <p><latex/>.js is written in 100% JavaScript and runs in the browser. No external dependencies need to be loaded.</p>
  </div>

  <div class="feature">
    <h2>CLI</h2>
    <p>The <code>latex.js</code> binary allows to translate <latex/> files in the console.</p>
  </div>

  <div class="feature">
    <h2>Compatibility</h2>
    <p><latex/>.js produces almost the exact same output you would get with <latex/>—except where impossible: glue cannot
    be translated to HTML, and sometimes cannot even be interpreted in the context of HTML.</p>
  </div>

  <div class="feature">
    <h2>Extensibility</h2>
    <p>New macros can easily be added in JavaScript. Very often it is much easier to implement a piece of functionality
    in JavaScript and CSS than it is in <latex/>.</p>
  </div>

  <div class="feature">
    <h2>Speed</h2>
    <p><latex/>.js only needs one pass over the document instead of several. References can be filled in by remembering
    and later modifying the relevant part of the DOM tree.</p>
  </div>

  <div class="feature">
    <h2>Open Source</h2>
    <p>Of course, <latex/>.js is completely Open Source. You can find the code on
    <a href="https://github.com/michael-brade/LaTeX.js">GitHub</a>.</p>
  </div>
</div>
