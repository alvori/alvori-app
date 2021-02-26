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
    ssr: 'ssr'
}
const prodAssetsPath = path.resolve(__dirname, '../../../dist', buildDir[buildMode], 'public')

module.exports = (env, options) => 
    merge(baseConfig(env), {
        entry: {
            app: './src/client-entry.js'
        },
        devServer: {
            stats: 'minimal',
            contentBase: __dirname + './dist',
            publicPath: '/',
            hot: true,
            disableHostCheck: true,
            // historyApiFallback: true,
            overlay: true,
        },
        devtool: isProd ? false : 'source-map',
        output: {
            filename: 'js/[name].js',
            chunkFilename: 'js/[name].js',
            path: isProd ? prodAssetsPath : path.resolve(__dirname, '../../../dist'),
            publicPath: '/',
        },
        target: 'web',
        optimization: {
            splitChunks: {
                chunks: 'async',
                cacheGroups: {
                    vendors: {
                        name: 'chunk-vendors',
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        chunks: 'initial'
                    },
                    common: {
                        name: 'chunk-common',
                        minChunks: 5,
                        priority: -20,
                        chunks: 'initial',
                        reuseExistingChunk: true
                    }
                }
            },
        },
        plugins: [
            new WebpackBar({
                name: 'Client'
            }),
            new MiniCssExtractPlugin({
                filename: isProd ? 'css/[name].[contenthash:8].css' : 'css/[name].css',
                chunkFilename: isProd ? 'css/[name].[contenthash:8].chunk.css' : 'css/[name].chunk.css',
            }),
            ...isProd ? [
                new WorkBoxPlugin.GenerateSW({
                    clientsClaim: true,
                    skipWaiting: true,
                    swDest: './service-worker.js',
                    exclude: [
                        // /index\.html$/,
                        /index\.js$/,
                    ],
                    runtimeCaching: [{
                        urlPattern: /(.*)/g,
                        handler: 'NetworkFirst',
                    }],
                }),
            ] : [],
            new HtmlWebpackPlugin({
                title: 'app',
                templateParameters: {
                    pwaManifest: '<link rel="manifest" href="/manifest.json"/>'
                },
                chunks: [
                    'vendors',
                    'common',
                    'index',
                    'app',
                ],
                // base: '/',
                inject: 'body',
                template: 'public/index.html',
                filename: isProd ? '../index.html' : 'index.html',
                scriptLoading: 'defer',
                // hash: true,
            }),
            new PreloadWebpackPlugin({
                rel: 'preload',
                include: 'initial',
                fileBlacklist: [
                    /\.map$/,
                    /hot-update\.js$/
                ]
            }),
            new PreloadWebpackPlugin({
                rel: 'prefetch',
                include: 'asyncChunks'
            }),
    
            new CopyPlugin({
                patterns: [{
                        from: './public',
                        toType: 'dir',
                        globOptions: {
                            ignore: [
                                '**/*.html',
                                '.DS_Store',
                            ]
                        },
                        to: prodAssetsPath,
                    },
                    {
                        from: path.resolve(__dirname, '../../ssr/index.js'),
                        to: path.resolve(__dirname, '../../../dist/ssr'),
                        toType: 'dir',
                        info: {
                            minimized: true
                        },
                    }
                ]
            }),    
        ],
    })
