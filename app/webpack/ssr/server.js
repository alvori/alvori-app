const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const WebpackBar = require('webpackbar')
const { merge } = require('webpack-merge')
const baseConfig = require('./base')
const CopyPlugin = require('copy-webpack-plugin')

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.PWA !== 'undefined' ? `${process.env.BUILD_MODE}-pwa` : process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr',
    spa: 'spa',
    'spa-pwa': 'spa-pwa',
    'ssr-pwa': 'ssr-pwa',
}
const Chain = require('webpack-chain')
const webpackConfig = new Chain()

webpackConfig
    .entry('app')
    .add('./app/entries/server-entry.js')
    .end()
    .output.path(
        isProd
            ? path.resolve(__dirname, '../../../dist', buildDir[buildMode])
            : path.resolve(__dirname, '../../../dist')
    )
    .filename('server-bundle.js')
    .libraryTarget('commonjs2')
    .publicPath('/')

webpackConfig.target('node')

webpackConfig.externals(
    nodeExternals({
        allowlist: /\.(css|vue)$/,
    })
)

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
                from: path.resolve(__dirname, '../../ssr/index.js'),
                to: path.resolve(__dirname, '../../../dist/', buildMode),
                toType: 'dir',
                info: {
                    minimized: true,
                },
            },
        ],
    },
])

module.exports = (env, options) => merge(baseConfig({ ...env, config: 'server' }), webpackConfig.toConfig())
