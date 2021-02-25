const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')
const {
    renderToString
} = require('@vue/server-renderer')
const app = express()

const appPath = path.join(__dirname, 'server-bundle.js')
const createApp = require(appPath).default

const render = async (req, res) => {

    const templatePath = path.join(__dirname, 'index.html')
    const getTemplate = () => fs.readFileSync(templatePath, 'utf8', (err, data) => data.toString())
    let template = getTemplate()

    const context = {
        url: req.url === '/index.html' ? '/' : req.url,
    }

    const {
        app,
        router,
    } = await createApp(context)

    let appContent
    let code = 200
    
    await renderToString(app).then((result) => {
        appContent = result
    }).catch((err) => {
        res.status(500).send('500 | Internal Server Error')
        console.error(`error during render : ${req.url}`)
        console.error(err)
    })

    if(router.currentRoute._value.name === '404') {
        code = 404
    }

    let html = template.replace('<div id="app"></div>', `<div id="app">${appContent}</div>`)
    res.status(code);
    res.set('content-type', 'text/html')
    res.send(html)
    res.end()
}

app.use(compression())

app.use(express.static(path.join(__dirname, './public'), {
    maxAge: 1000 * 60 * 60 * 24 * 30
}))

app.get('*', async (req, res) => {
    await render(req, res)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, function () {
    console.log(`App listening on port ${PORT}\n`)
})