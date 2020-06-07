'use strict'

require! {
    path
    fs: { promises: fs }
    'child_process': { spawn }
    'os': { EOL }
}


describe 'LaTeX.js API test', !->

    test 'node legacy module API', ->
        const node = spawn 'node', [path.join __dirname, 'api/node.js'], { env: { PATH: process.env.PATH } }

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

        .to.eventually.equal '<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL

    test 'node ES6 module API', ->
        const node = spawn 'node', [path.join __dirname, 'api/node.mjs'], { env: { PATH: process.env.PATH } }

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

        .to.eventually.equal '<html style="--size: 13.284px; --textwidth: 56.162%; --marginleftwidth: 21.919%; --marginrightwidth: 21.919%; --marginparwidth: 48.892%; --marginparsep: 14.612px; --marginparpush: 6.642px;"><head><title>untitled</title><meta charset="UTF-8"></meta><link type="text/css" rel="stylesheet" href="css/katex.css"><link type="text/css" rel="stylesheet" href="css/article.css"><script src="js/base.js"></script></head><body><div class="body"><p>Hi, this is a line of text.</p></div></body></html>' + EOL

    test 'browser API', ->>
        page = await chrome.newPage!
        await page.goto 'file://' + path.join __dirname, 'api/browser.html'
        expect(await page.$eval '.body', (node) -> node.outerHTML)
            .to.equal '<div class="body"><p>Hi, this is a line of text.</p></div>'
        await page.close!

    test 'web component API', ->>
        data = await fs.readFile path.join(__dirname, 'api/webcomponent.html'), 'utf8'
        await takeScreenshot data, path.join(__dirname, 'screenshots/webcomponent')

    test 'web component module API', ->>
        data = await fs.readFile path.join(__dirname, 'api/webcomponent.module.html'), 'utf8'
        await takeScreenshot data, path.join(__dirname, 'screenshots/webcomponent')
