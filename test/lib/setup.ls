require! {
    fs
    util
    chai
    http
    'serve-handler'
    puppeteer
    pixelmatch
    pngjs: { PNG }
}

chai.use require 'chai-as-promised'

global.expect = chai.expect
global.test = it                # because livescript sees "it" as reserved variable


var cPage, fPage
var server, testHtmlPage

before !->>
    global.chrome = await puppeteer.launch {
        devtools: false
        dumpio: false
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
        defaultViewport: { width: 1000, height: 0, deviceScaleFactor: 2 }
    }

    # global.firefox = await puppeteer.launch {
    #     product: 'firefox'
    #     executablePath: '/opt/firefox/firefox'
    #     headless: true
    #     devtools: false
    #     dumpio: false
    #     defaultViewport: { width: 1000, height: 0, deviceScaleFactor: 2 }
    # }

    cPage := (await chrome.pages!).0              # there is always one page available
    # fPage := (await firefox.pages!).0

    cPage.on 'console', (msg) ->
        if msg._type == 'error'
            console.error "Error in chrome: ", msg._text

    # fPage.on 'console', (msg) ->
    #     if msg._type == 'error'
    #         console.error "Error in firefox: ", msg._text


    # start the webserver in the dist directory so that CSS and fonts are found
    # redirect from /dist to /
    server := http.createServer (request, response) !->>
        if request.url == "/"
            response.writeHead 200, 'Content-Type': 'text/html'
            response.end testHtmlPage
        else
            await serve-handler request, response, {
                public: process.cwd! + "/dist"
                redirects:
                    { source: "/dist/:file", destination: "/:file" }
                    { source: "/dist/:dir/:file", destination: "/:dir/:file" }
            }

    listen = util.promisify(server.listen.bind server)
    await listen { host: 'localhost', port: 0, exclusive: true }




after !->>
    await chrome.close!
    # await firefox.close!
    server.close!


function compareScreenshots(filename)
    if fs.existsSync filename + '.png'
        # now compare the screenshots and delete the new one if they match
        png1 = PNG.sync.read(fs.readFileSync(filename + '.png'))
        png2 = PNG.sync.read(fs.readFileSync(filename + '.new.png'))

        diff = new PNG { width: png1.width, height: png1.height }

        dfpx = pixelmatch png1.data, png2.data, diff.data, png1.width, png1.height,
            threshold: 0
            diffColorAlt: [0, 255, 0]

        fs.writeFileSync(filename + '.diff.png', PNG.sync.write(diff))

        if dfpx > 0
            throw new Error "screenshots differ by #{dfpx} pixels - see #{filename + '.*.png'}"
        else
            fs.unlinkSync filename + '.new.png'
            fs.unlinkSync filename + '.diff.png'
    else
        # if no screenshot exists yet, use this new one
        fs.renameSync filename + '.new.png', filename + '.png'


# render html and take screenshot
global.takeScreenshot = (html, filename) !->>
    testHtmlPage := html

    await cPage.goto 'http://localhost:' + server.address!.port
    await cPage.addStyleTag content: ".body { border: .4px solid; height: max-content; }"

    # await fPage.goto 'http://localhost:' + server.address!.port
    # await fPage.addStyleTag content: ".body { border: .4px solid; height: max-content; }"

    cfile = filename + ".ch"
    # ffile = filename + ".ff"

    await cPage.screenshot {
        omitBackground: true
        path: cfile + '.new.png'
    }

    # await fPage.screenshot {
    #     # omitBackground: true
    #     path: ffile + '.new.png'
    # }

    compareScreenshots cfile
    # compareScreenshots ffile

    testHtmlPage := ""