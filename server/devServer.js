import path from 'path'
import express from "express";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server"
import { clientConfig } from '../webpack/ssr/clientConfig.js'
import { serverConfig } from "../webpack/ssr/serverConfig.js";
import { createFsFromVolume, fs, Volume } from 'memfs'
import { importFromStringSync } from 'module-from-string'
import { renderToString } from '@vue/server-renderer'

let server, clientCfg, serverCfg, clientCompiler, serverCompiler, createApp, tpl, readyPromise

const runSPA = () => {
    const runServer = async () => {
        runWebpack()
        createPromise()
        serverInit()
    }
    
    const runWebpack =  () => {
        clientCfg = clientConfig(process.env)
        clientCompiler = webpack(clientCfg)
    }
    
    const setup = (cb) => {
        let ready, tmpl
    
        const readyPromise = new Promise((r) => {
            ready = r
        })
    
        const update = () => {
            if (tmpl) {
                ready()
                cb(tmpl)
            }
        }
    
        const cmfs = createFsFromVolume(new Volume());
        clientCompiler.outputFileSystem = cmfs
        clientCompiler.hooks.assetEmitted.tap(
            'getTpl',
            (file, { content, source, outputPath, compilation, targetPath }) => {
                if(file === 'index.html') {
                    tmpl = content.toString('utf8')
                    delete compilation.assets[file]
                    update()
                }
            }
        );
    
        return readyPromise
    }
    
    const createPromise = () => {
        readyPromise = setup((template) => {
            tpl = template
        })
    }
    
    const render = async (req, res) => {
        let code = 200
        res.status(code)
        res.set('content-type', 'text/html')
        res.send(tpl)
        res.end()
    }
    
    const serverInit = () => {
        server = new WebpackDevServer({
            ...clientCfg.devServer,
            setupMiddlewares: (middlewares, devServer) => {
                devServer.app.use('/manifest.json', express.static(path.join(process.cwd(), 'public', 'manifest.json')))
                devServer.app.use('/favicon.ico', express.static(path.join(process.cwd(), 'public', 'favicon.ico')))
                devServer.app.use('/assets', express.static(path.join(process.cwd(), 'src', 'assets')))
                devServer.app.use('/favicon', express.static(path.join(process.cwd(), 'public', 'favicon')))
    
                devServer.app.get(/^\/(?!js|css|public).*$/, async (req, res) => {
                    await readyPromise
                    render(req, res)
                })
    
                return middlewares
            },
        }, clientCompiler)
    
        serverStart()
    }
    
    const serverStart = async () => {
        await server.start();
        const url = `${server.options.server.type}://${server.options.host}:${server.options.port}`
        console.log(`\nApp listening on port ${url}\n`);
    }
    
    runServer()
}

const runSSR = () => {
    const runServer = async () => {
        runWebpack()
        createPromise()
        serverInit()
    }
    
    const runWebpack =  () => {
        clientCfg = clientConfig(process.env)
        serverCfg = serverConfig(process.env)
        clientCompiler = webpack(clientCfg)
        serverCompiler = webpack(serverCfg)
    }
    
    const setup = (cb) => {
        let ready, tmpl, bundle
    
        const readyPromise = new Promise((r) => {
            ready = r
        })
    
        const update = () => {
            if (bundle && tmpl) {
                ready()
                cb(bundle, tmpl)
            }
        }
    
        const cmfs = createFsFromVolume(new Volume());
        clientCompiler.outputFileSystem = cmfs
        clientCompiler.hooks.assetEmitted.tap(
            'getTpl',
            (file, { content, source, outputPath, compilation, targetPath }) => {
                if(file === 'index.html') {
                    tmpl = content.toString('utf8')
                    delete compilation.assets[file]
                    update()
                }
            }
        );
    
        const serverPath = path.join(serverCfg.output.path, serverCfg.output.filename)
        const serverFS = createFsFromVolume(new Volume());
        serverCompiler.outputFileSystem = serverFS;
        serverCompiler.watch({}, (err, stats) => {
            if (stats.compilation.errors.length > 0) {
                console.error(stats.compilation.errors)
            }
            if (err) {
                throw err
            }
            stats = stats.toJson()
            if (stats.errors.length) return
            bundle = importFromStringSync(serverFS.readFileSync(serverPath, 'utf-8')).default
            update()
        })
    
        return readyPromise
    }
    
    const createPromise = () => {
        readyPromise = setup((bundle, template) => {
            createApp = bundle
            tpl = template
        })
    }
    
    const render = async (req, res) => {
        let appContent = ''
        let code = 200
        let state = ''
    
        const ctx = {
            url: req.url
        }
        const {app, router} = await createApp(ctx)
    
        await renderToString(app, ctx)
                .then((result) => {
                    appContent = result
                })
                .catch((err) => {
                    res.status(500).send('500 | Internal Server Error')
                    console.error(`error during render : ${req.url}`)
                    console.error(err)
                })
        
        const asyncData = app.config.globalProperties.$asyncData
        const meta = app.config.globalProperties.$meta
    
        state = `
            <script id="init-state">
                window.__ALVORI_INITIAL_STATE__ = {}
                window.__ALVORI_INITIAL_STATE__.data = ${typeof asyncData !== 'undefined' ? JSON.stringify(asyncData) : `null`}
            </script>
        `
    
        if (router.currentRoute._value.name === '404') {
            code = 404
        }
    
        let html = tpl.replace('<div id="app"></div>', `<div id="app">${appContent}</div>${state}`)
        html = insertMeta(meta, html)
        res.status(code)
        res.set('content-type', 'text/html')
        res.send(html)
        res.end()
    }
    
    const insertMeta = (meta, tpl) => {
        if (!meta || Object.keys(meta).length == 0) return tpl
        return tpl
            .replace(`<html`, `<html ${meta.htmlAttr}`)
            .replace(`<head>`, `<head>${meta.head}`)
            .replace(`<body`, `<body ${meta.bodyAttr}`)
            .replace(`</body>`, `${meta.body}</body>`)
    }
    
    const serverInit = () => {
        server = new WebpackDevServer({
            ...clientCfg.devServer,
            setupMiddlewares: (middlewares, devServer) => {
                devServer.app.use('/manifest.json', express.static(path.join(process.cwd(), 'public', 'manifest.json')))
                devServer.app.use('/favicon.ico', express.static(path.join(process.cwd(), 'public', 'favicon.ico')))
                devServer.app.use('/assets', express.static(path.join(process.cwd(), 'src', 'assets')))
                devServer.app.use('/favicon', express.static(path.join(process.cwd(), 'public', 'favicon')))
    
                devServer.app.get(/^\/(?!js|css|public).*$/, async (req, res) => {
                    await readyPromise
                    render(req, res)
                })
    
                return middlewares
            },
        }, clientCompiler)
    
        serverStart()
    }
    
    const serverStart = async () => {
        await server.start();
        const url = `${server.options.server.type}://${server.options.host}:${server.options.port}`
        console.log(`\nApp listening on port ${url}\n`);
    }
    
    runServer()
}

const run = {
    spa: runSPA,
    ssr: runSSR,
}

run[process.env.BUILD_MODE]()
