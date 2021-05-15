const path = require('path')
const webpack = require('webpack')
const WebpackBar = require('webpackbar')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin')
const WorkBoxPlugin = require('workbox-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { merge } = require('webpack-merge')
const baseConfig = require('./base.js')

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr',
    spa: 'spa',
}
const prodAssetsPath = path.resolve(__dirname, '../../../dist', buildDir[buildMode], 'public')

const Chain = require('webpack-chain')
const webpackConfig = new Chain()

webpackConfig
    .entry('app')
    .add('./src/client-entry.js')
    .end()
    .output.path(isProd ? prodAssetsPath : path.resolve(__dirname, '../../../dist'))
    .filename('js/[name].js')
    .chunkFilename('js/[name].js')
    .publicPath('/')

webpackConfig.devServer
    .set('stats', 'minimal')
    .set('contentBase', __dirname + './dist')
    .set('publicPath', '/')
    .set('hot', true)
    .set('disableHostCheck', true)
    // historyApiFallback: true,
    .set('overlay', true)

webpackConfig.target('web')

webpackConfig.devtool(isProd ? false : 'source-map')

webpackConfig.optimization.splitChunks({
    chunks: 'async',
    cacheGroups: {
        vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial',
        },
        common: {
            name: 'chunk-common',
            minChunks: 5,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true,
        },
    },
})

webpackConfig.plugin('webpackBar').use(WebpackBar, [
    {
        name: 'Client',
    },
])

webpackConfig.plugin('MiniCssExtractPlugin').use(MiniCssExtractPlugin, [
    {
        filename: isProd ? 'css/[name].[contenthash:8].css' : 'css/[name].css',
        chunkFilename: isProd ? 'css/[name].[contenthash:8].chunk.css' : 'css/[name].chunk.css',
    },
])

if (isProd) {
    webpackConfig.plugin('workbox').use(WorkBoxPlugin.GenerateSW, [
        {
            clientsClaim: true,
            skipWaiting: true,
            swDest: './service-worker.js',
            exclude: [
                // /index\.html$/,
                /index\.js$/,
            ],
            runtimeCaching: [
                {
                    urlPattern: /(.*)/g,
                    handler: 'NetworkFirst',
                },
            ],
        },
    ])
}

webpackConfig.plugin('HtmlWebpackPlugin').use(HtmlWebpackPlugin, [
    {
        title: 'app',
        templateParameters: {
            pwaManifest: '<link rel="manifest" href="/manifest.json"/>',
        },
        chunks: ['vendors', 'common', 'index', 'app'],
        // base: '/',
        inject: 'body',
        template: 'public/index.html',
        filename: isProd ? '../index.html' : 'index.html',
        scriptLoading: 'defer',
        // hash: true,
    },
])

webpackConfig.plugin('preload').use(PreloadWebpackPlugin, [
    {
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [
            /\.(png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
            /\.map$/,
            /hot-update\.js$/,
        ],
    },
])

webpackConfig.plugin('prefetch').use(PreloadWebpackPlugin, [
    {
        rel: 'prefetch',
        include: 'asyncChunks',
    },
])

webpackConfig.plugin('copy').use(CopyPlugin, [
    {
        patterns: [
            {
                from: './public',
                toType: 'dir',
                globOptions: {
                    ignore: ['**/*.html', '.DS_Store'],
                },
                to: prodAssetsPath,
            },
            {
                from: path.resolve(__dirname, '../../ssr/index.js'),
                to: path.resolve(__dirname, '../../../dist/ssr'),
                toType: 'dir',
                info: {
                    minimized: true,
                },
            },
        ],
    },
])

module.exports = (env, options) => merge(baseConfig({ ...env, config: 'client' }), webpackConfig.toConfig())
