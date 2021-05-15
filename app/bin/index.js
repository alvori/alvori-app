#!/usr/bin/env node

const { spawn } = require('child_process')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

const runDev = (args) => {
    process.env.MODE = 'development'
    process.env.BUILD_MODE = args.mode
    const run = spawn('node', ['app/ssr/dev-server.js'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
        env: process.env,
    })
    run.on('error', (error) => {
        console.error(`error: ${error.message}`)
        reject(false)
    })
}

const runProd = (args) => {
    process.env.MODE = 'production'
    process.env.BUILD_MODE = args.mode
    const run = spawn('node', ['dist/ssr/index.js'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
        env: process.env,
    })
    run.on('error', (error) => {
        console.error(`error: ${error.message}`)
        reject(false)
    })
}

const runBuild = async (args) => {
    process.env.MODE = 'production'
    process.env.BUILD_MODE = args.mode

    const clientConfig = require('../webpack/ssr/client')({ CONFIG: 'client', ...process.env })
    const serverConfig = require('../webpack/ssr/server')({ CONFIG: 'server', ...process.env })

    const distDir = serverConfig.output.path

    rimraf(path.join(distDir), (err) => {
        console.log(err)
    })

    const clientCompiler = webpack(clientConfig)
    const serverCompiler = webpack(serverConfig)

    const generatePackageJSON = () => {
        return new Promise((resolve, reject) => {
            const file = path.join(process.cwd(), 'package.json')

            if (fs.existsSync(file)) {
                let pkg = JSON.parse(fs.readFileSync(file))
                let newPkg = {}

                for (let k in pkg) {
                    if (k !== 'devDependencies') {
                        newPkg[k] = pkg[k]
                    }
                }
                newPkg.scripts.start = 'node index.js'

                fs.writeFileSync(
                    `${distDir}/package.json`,
                    JSON.stringify(newPkg, null, 4),
                    'UTF-8',
                    (err) => err && console.log(err)
                )
                resolve()
            } else {
                console.log(`File preparation error: The package.json file does not exist`)
                reject()
            }
        })
    }

    clientCompiler.run()
    serverCompiler.run()

    const build = () => {
        let clientReady = false,
            serverReady = false,
            ready

        const readyPromise = new Promise((r) => {
            ready = r
        })

        const update = () => {
            if (clientReady && serverReady) {
                ready()
            }
        }

        clientCompiler.hooks.done.tap('done-compiling', ({ compilation: { errors } }) => {
            errors.forEach((err) => console.error('[Client]', err))
            if (errors.length === 0) {
                clientReady = true
                update()
            }
        })

        serverCompiler.hooks.done.tap('done-compiling', ({ compilation: { errors } }) => {
            errors.forEach((err) => console.error('[Server]', err))
            if (errors.length === 0) {
                serverReady = true
                update()
            }
        })

        return readyPromise
    }

    const readyPromise = build()

    readyPromise.then(() => {
        generatePackageJSON().then(() => {
            console.log(`
Project building finished!

Deploy guide: https://alvori.com/docs/deploy

Enjoy! - Alvori Team
        `)
        })
    })
}

module.exports = { runDev, runProd, runBuild }
