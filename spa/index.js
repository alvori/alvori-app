const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')
const app = express()

const render = async (req, res) => {
    const templatePath = path.join(__dirname, 'index.html')
    const getTemplate = () => fs.readFileSync(templatePath, 'utf8', (err, data) => data.toString())
    let template = getTemplate()
    let code = 200

    let html = template
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
