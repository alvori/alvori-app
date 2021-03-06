const path = require('path')
const fs = require('fs')
const express = require('express')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const chokidar = require('chokidar')
const {
    renderToString
} = require('@vue/server-renderer')
const app = express()
const MFS = require('memory-fs');
const requireFromString = require('require-from-string')
const readFile = (fs, file) => {
    try {
        return fs.readFileSync(path.join(path.resolve(__dirname, '../../dist'), file), 'utf-8')
    } catch (e) {}
};

const clientConfig = require('../webpack/ssr/client')()
const serverConfig = require('../webpack/ssr/server')()

const clientCompiler = webpack(clientConfig)
const serverCompiler = webpack(serverConfig)

const setup = (cb) => {
    let bundle, tpl, ready

    const readyPromise = new Promise((r) => {
        ready = r
    })

    const update = () => {
        if (bundle && tpl) {
            ready()
            cb(bundle, tpl)
        }
    }

    const cmfs = new MFS();
    clientCompiler.outputFileSystem = cmfs
    clientCompiler.hooks.done.tap('done-compiling', ({
        compilation: {
            errors,
            warnings,
            assets
        }
    }) => {
        errors.forEach(err => console.error('[Client]', err))
        warnings.forEach(err => console.warn('[Client]', err))

        if (errors.length === 0) {
            const tplPath = path.join(path.resolve(__dirname, '../../dist'), 'index.html')
            tpl = cmfs.readFileSync(tplPath, 'utf-8')
            cmfs.unlinkSync(tplPath, 'index.html')
            update()
        }
    })

    const mfs = new MFS()
    serverCompiler.outputFileSystem = mfs
    serverCompiler.watch({}, (err, stats) => {
        if (stats.compilation.errors.length > 0) {
            console.error(stats.compilation.errors)
        }
        if (err) {
            throw err
        }
        stats = stats.toJson()
        if (stats.errors.length) return;
        bundle = readFile(mfs, 'server-bundle.js')
        update()
    });

    return readyPromise
}

const createRenderer = (bundle) => requireFromString(bundle).default

let renderer, template
const readyPromise = setup(async (bundle, tpl) => {
    template = await tpl
    renderer = await createRenderer(bundle)
})

const insertMeta = (meta, tpl) => {
    if(!meta) return tpl
    return tpl.replace(`<html`, `<html ${meta.htmlAttr}`)
    .replace(`<head>`, `<head>${meta.head}`)
    .replace(`<body`, `<body ${meta.bodyAttr}`)
    .replace(`</body>`, `${meta.body}</body>`)
}

const render = async (req, res) => {
    const context = {
        url: req.url,
    }

    const {
        app,
        router,
        meta,
    } = await renderer(context)

    let appContent
    let code = 200

    await renderToString(app).then((result) => {
        appContent = result
    }).catch((err) => {
        res.status(500).send('500 | Internal Server Error')
        console.error(`error during render : ${req.url}`)
        console.error(err)
    })

    if (router.currentRoute._value.name === '404') {
        code = 404
    }

    let html = template.replace('<div id="app"></div>', `<div id="app">${appContent}</div>`)
    html = insertMeta(meta.data, html)
    res.status(code)
    res.set('content-type', 'text/html')
    res.send(html)
    res.end()
}

const server = new WebpackDevServer(clientCompiler, {
    ...clientConfig.devServer,
    before(app, server) {
        chokidar.watch(
            ['./public/index.html']
        ).on('all', function () {
            server.sockWrite(server.sockets, 'content-changed')
            console.log('\x1b[32m', 'HTML template updated', '\x1b[37m')
        })
    },
    after: (app) => {
        app.use('/manifest.json', express.static(path.join(__dirname, '../../public', 'manifest.json')))
        app.use('/favicon.ico', express.static(path.join(__dirname, '../../public', 'favicon.ico')))
        app.use('/assets', express.static(path.join(__dirname, '../../src', 'assets')))
        app.use('/favicon', express.static(path.join(__dirname, '../../public', 'favicon')))
        app.get(clientConfig.output.publicPath + '*', async (req, res) => {
            await readyPromise
            render(req, res)
        })
    }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`App listening on port http://localhost:${PORT}\n`)
});
