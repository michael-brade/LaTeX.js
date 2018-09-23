'use strict'

require! {
    path
    'child_process': { spawn }
    'os': { EOL }
}


describe 'LaTeX.js API test', !->

    test 'node API', ->
        const node = spawn 'babel-node', ['test/api/node.js'], { env: { PATH: process.env.PATH } }

        expect new Promise (resolve, reject) ->
            stdout = ""
            stderr = ""

            node.stdout.on 'data', (data) ->
                stdout += data.toString!

            node.stderr.on 'data', (data) ->
                stderr += data.toString!

            node.on 'exit', (code, signal) ->
                if code == 0
                    resolve stdout
                else
                    reject stderr

            node.on 'error', (err) ->
                node.removeAllListeners 'exit'
                reject err

        .to.eventually.equal '<html style="--size:13.33333px;--textwidth:56%;--marginleftwidth:22%;--marginrightwidth:22%;--marginparwidth:48.20264845142601%;--marginparsep:14.666663000000002px;--marginparpush:6.666665px"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL

    test 'browser API', ->

    test 'web component API', ->>
        await page.goto 'file://' + path.join __dirname, 'api/webcomponent.html'
        takeScreenshot path.join __dirname, 'screenshots/webcomponent'
