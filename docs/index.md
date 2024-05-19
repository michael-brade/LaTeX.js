---
layout: home
navbar: false
footer: true

title: LaTeX.js
titleTemplate:

hero:
  name: LaTeX.js
  text: Desc

  image:
    src: /img/latexjs.png
  actions:
    - theme: brand
      text: Documentation
      link: /usage
    - theme: alt
      text: Playground
      link: /playground

features:
  - title: 100% JavaScript
    icon:
      src: /img/JavaScript.svg
    details: <latex/>.js is written in 100% JavaScript and runs in the browser. No external dependencies need to be loaded.
  - title: CLI
    icon:
      src: /img/cli.svg
    details: The <code>latex.js</code> binary allows to translate <latex/> files in the console. It depends on a DOM implementation (svgdom in this case).
  - title: Compatibility
    icon:
      src: /img/compatible.svg
    details: |
      <latex/>.js produces almost the exact same output you would get with <latex/>—except where impossible: glue cannot
      be translated to HTML, and sometimes cannot even be interpreted in the context of HTML.
  - title: Extensibility
    icon:
      src: /img/extend.png
    details: New macros can easily be added in JavaScript. Very often it is much easier to implement a piece of functionality
      in JavaScript and CSS than it is in <latex/>.
  - title: Speed
    icon: # 🚀
      src: /img/speed.svg
    details: <latex/>.js only needs one pass over the document instead of several. References can be filled in by remembering
      and later modifying the relevant part of the DOM tree.
  - title: Open Source
    icon: # <img src="/img/open_source.svg">
      src: /img/open_source.svg
    details: Of course, <latex/>.js is completely Open Source. You can find the code on <a href="https://github.com/michael-brade/LaTeX.js">GitHub</a>.
---
