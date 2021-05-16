const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const WebpackBar = require('webpackbar')
const { merge } = require('webpack-merge')
const baseConfig = require('./base')

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr',
    ssrpwa: 'ssrpwa',
}

const Chain = require('webpack-chain')
const webpackConfig = new Chain()

webpackConfig
    .entry('app')
    .add('./src/server-entry.js')
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

module.exports = (env, options) => merge(baseConfig({ ...env, config: 'server' }), webpackConfig.toConfig())
