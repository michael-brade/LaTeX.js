require! {
    fs
    chai
    puppeteer
    pixelmatch
    pngjs: { PNG }
}

chai.use require 'chai-as-promised'

global.expect = chai.expect
global.test = it                # because livescript sees "it" as reserved variable

global.page = undefined         # used to make screenshots


var browser

before !->>
    browser := await puppeteer.launch {
        devtools: false
        dumpio: false
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        defaultViewport: { width: 1000, height: 0, deviceScaleFactor: 2 }
    }

    global.page = (await browser.pages!).0              # there is always one page available

    page.on 'console', (msg) ->
        for i til msg.args.length
            console.log "#{i}: #{msg.args[i]}"


after !->>
    await browser.close!


# take screenshot of current page
global.takeScreenshot = (filename) !->>
    await page.screenshot {
        omitBackground: true
        path: filename + '.new.png'
    }

    if fs.existsSync filename + '.png'
        # now compare the screenshots and delete the new one if they match
        png1 = PNG.sync.read(fs.readFileSync(filename + '.png'))
        png2 = PNG.sync.read(fs.readFileSync(filename + '.new.png'))

        diff = new PNG { width: png1.width, height: png1.height }

        dfpx = pixelmatch png1.data, png2.data, diff.data, png1.width, png1.height, threshold: 0

        diff.pack!.pipe(fs.createWriteStream(filename + '.diff.png'))

        if dfpx > 0
            throw new Error "screenshots differ by #{dfpx} pixels - see #{filename + '.*.png'}"
        else
            fs.unlinkSync filename + '.new.png'
            fs.unlinkSync filename + '.diff.png'
    else
        # if no screenshot exists yet, use this new one
        fs.renameSync filename + '.new.png', filename + '.png'
