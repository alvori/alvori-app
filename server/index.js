import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import express from 'express'
import compression from 'compression'
import { renderToString } from '@vue/server-renderer'
import createApp from './server-bundle.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()

const insertMeta = (meta, tpl) => {
    if (!meta) return tpl
    return tpl
        .replace(`<html`, `<html ${meta.htmlAttr}`)
        .replace(`<head>`, `<head>${meta.head}`)
        .replace(`<body`, `<body ${meta.bodyAttr}`)
        .replace(`</body>`, `${meta.body}</body>`)
}

const render = async (req, res) => {
    const templatePath = path.join(__dirname, 'index.html')
    const getTemplate = () => fs.readFileSync(templatePath, 'utf8', (err, data) => data.toString())
    let template = getTemplate()

    const context = {
        url: req.url === '/index.html' ? '/' : req.url,
    }

    const { app, router } = await createApp(context)

    let appContent
    let code = 200
    let state = ''

    await renderToString(app)
        .then((result) => {
            appContent = result
        })
        .catch((err) => {
            res.status(500).send('500 | Internal Server Error')
            console.error(`error during render : ${req.url}`)
            console.error(err)
        })

    if (router.currentRoute._value.name === '404') {
        code = 404
    }

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

    let html = template.replace('<div id="app"></div>', `<div id="app">${appContent}</div>${state}`)
    html = insertMeta(meta, html)
    res.status(code)
    res.set('content-type', 'text/html')
    res.send(html)
    res.end()
}

app.use(compression())

app.use(
    express.static(path.join(__dirname, './public'), {
        maxAge: 1000 * 60 * 60 * 24 * 30,
    })
)

app.get('*', async (req, res) => {
    await render(req, res)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, function () {
    console.log(`App listening on port ${PORT}\n`)
})
