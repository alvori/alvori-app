const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const WebpackBar = require('webpackbar');
const {
    merge
} = require('webpack-merge')
const baseConfig = require('./base')

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr'
}

module.exports = (env, options) =>
    merge(baseConfig(env), {
        entry: {
            app: './src/server-entry.js'
        },
        target: 'node',
        output: {
            filename: 'server-bundle.js',
            libraryTarget: 'commonjs2',
            path: isProd ? path.resolve(__dirname, '../../../dist', buildDir[buildMode]) : path.resolve(__dirname, '../../../dist'),
            publicPath: '/',
        },
        externals: nodeExternals({
            allowlist: /\.(css|vue)$/
        }),
        plugins: [
            new WebpackBar({
                name: 'Server'
            }),
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        ],
    })
