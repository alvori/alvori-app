import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import nodeExternals from 'webpack-node-externals'
import WebpackBar from 'webpackbar'
import { merge } from 'webpack-merge'
import { baseConfig } from './baseConfig.js'
import CopyPlugin from 'copy-webpack-plugin'
import Chain from 'webpack-chain'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.PWA !== 'undefined' ? `${process.env.BUILD_MODE}-pwa` : process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr',
    spa: 'spa',
    'spa-pwa': 'spa-pwa',
    'ssr-pwa': 'ssr-pwa',
}

let alvori = []
let alvoriRepo = fs.readdirSync(path.join(process.cwd(), 'node_modules/@alvori'))
alvoriRepo.forEach(dir => {
    alvori.push(`@alvori/${dir}`)
})

const webpackConfig = new Chain()

webpackConfig.mode(process.env.MODE)

webpackConfig
    .entry('server')
    .add(path.resolve(__dirname, '../../entries/server-entry.js'))
    .end()
    .output.path(
        isProd ? path.resolve(process.cwd(), 'dist', buildDir[buildMode]) : path.resolve(process.cwd(), 'dist/dev')
    )
    .filename('server-bundle.js')
    .libraryTarget('module')
    .publicPath('/')

webpackConfig.externals(
    nodeExternals({
        allowlist: [...alvori, /\.(css|vue)$/],
        importType: 'module'
    }))

webpackConfig.plugin('MiniCssExtractPlugin').use(MiniCssExtractPlugin, [
    {
        filename: isProd ? 'css/[name].[contenthash:8].css' : 'css/[name].css',
        chunkFilename: isProd ? 'css/[name].[contenthash:8].chunk.css' : 'css/[name].chunk.css',
    },
])

webpackConfig.plugin('webpackBar').use(WebpackBar, [
    {
        name: 'Server',
    },
])

webpackConfig.plugin('optimize').use(webpack.optimize.LimitChunkCountPlugin, [
    {
        maxChunks: 1,
    },
])

webpackConfig.plugin('copy').use(CopyPlugin, [
    {
        patterns: [
            {
                from: path.resolve(__dirname, '../../server/index.js'),
                to: path.resolve(process.cwd(), 'dist', buildMode),
                toType: 'dir',
                info: {
                    minimized: true,
                },
            },
        ],
    },
])

const serverConfig = (env, options) => merge(
    baseConfig({ ...env, config: 'server' }),
    webpackConfig.toConfig(),
    {
        output: {
            module: true,
            chunkFormat: 'module',
            environment: {
                module: true
            }
        },
        externalsPresets: {
            node: true
        },
        externalsType: 'module',
        experiments: {
            outputModule: true,
        },
    })

export {
    serverConfig
}