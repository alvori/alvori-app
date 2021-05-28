const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
    .add(path.resolve(__dirname, '../../entries/server-entry.js'))
    .end()
    .output.path(
        isProd ? path.resolve(process.cwd(), 'dist', buildDir[buildMode]) : path.resolve(process.cwd(), 'dist/dev')
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
                from: path.resolve(__dirname, '../../ssr/index.js'),
                to: path.resolve(process.cwd(), 'dist', buildMode),
                toType: 'dir',
                info: {
                    minimized: true,
                },
            },
        ],
    },
])

module.exports = (env, options) => merge(baseConfig({ ...env, config: 'server' }), webpackConfig.toConfig())
