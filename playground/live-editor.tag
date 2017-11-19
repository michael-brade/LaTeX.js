<live-editor>
  <latex></latex>

  <iframe ref="preview" sandbox="allow-same-origin" srcdoc="<!DOCTYPE html>
    <html>
      <head>
        <title>LaTeX preview</title>
        <link rel='stylesheet' href='../src/default.css'>
      </head>

      <body>
      </body>
    </html>">
  </iframe>

  <messages></messages>

  <script>
    var self = this

    this.on('mount', function() {
      var editor = ace.edit(self.root.querySelector('latex'))
      var doc = editor.getSession()

      editor.setTheme('ace/theme/monokai')
      editor.session.setUseWorker(false)
      editor.$blockScrolling = Infinity
      editor.setOptions({ fontSize: "15pt" })

      doc.setMode('ace/mode/latex')
      doc.setTabSize(4)
      doc.setValue(self.root._innerHTML)

      doc.on('change', function(e) {
        compile(doc.getValue())
      })

      self.refs.preview.addEventListener("load", function() {
        compile(doc.getValue())
      })
    })

    function compile(latex) {
      var messages = self.root.querySelector('messages')
      try {
        html = latexjs.parse(latex)
        self.refs.preview.contentDocument.body.innerHTML = html
        messages.innerHTML = ""
      } catch (e) {
        console.log(e.message)
        messages.innerHTML = e.message
      }
    }
  </script>

  <style>
    :scope {
      display: grid;
      height: 100%;
      overflow: hidden;
      grid-template-columns: 50% 50%;
      grid-template-rows: 90% 10%;
      grid-template-areas:
        "latex preview"
        "latex messages";
    }
    latex {
      grid-area: latex;
    }
    iframe {
      grid-area: preview;
      color: #333;
      border: none;
      width: 100%;
      height: 100%;
    }
    messages {
      grid-area: messages;
      display: block;
      vertical-align: bottom;
    }
  </style>
</live-editor>
