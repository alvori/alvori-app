import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import WebpackBar from 'webpackbar'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import PreloadWebpackPlugin from '@vue/preload-webpack-plugin'
import WorkBoxPlugin from 'workbox-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import { merge } from 'webpack-merge'
import { baseConfig } from './baseConfig.js'
import Chain from 'webpack-chain'

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
const prodAssetsPath = path.resolve(process.cwd(), 'dist', buildDir[buildMode], 'public')
const webpackConfig = new Chain()

webpackConfig
    .entry('app')
    .add(path.resolve(__dirname, '../../entries/client-entry.js'))
    .end()
    .output.path(isProd ? prodAssetsPath : path.resolve(process.cwd(), 'dist/dev'))
    .filename('js/[name].js')
    .chunkFilename('js/[name].js')
    .publicPath('/')

webpackConfig.module
    .rule('babel')
    .test(/\.m?js$/)
    .exclude.add(/(node_modules|bower_components)/)
    .end()
    .use('babel')
    .loader('babel-loader')
    .options({
        envName: isProd ? 'prod' : 'dev',
    })

// webpackConfig.devServer
//     // .set('stats', 'minimal')
//     // .set('contentBase', path.join(process.cwd(), 'dist/dev'))
//     // .set('publicPath', '/')
//     // .set('hot', true)
//     // .set('open', true)
//     // .set('disableHostCheck', true)
//     // historyApiFallback: true,
//     // .set('overlay', true)
//     .set('static', {
//         directory: path.resolve(process.cwd(), './dist'),
//         publicPath: path.resolve(process.cwd()),
//         watch: true,
//     })

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

if (isProd && process.env.PWA !== 'undefined') {
    webpackConfig.plugin('workbox').use(WorkBoxPlugin.GenerateSW, [
        {
            clientsClaim: true,
            skipWaiting: true,
            swDest: './service-worker.js',
            exclude: [
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
        inject: 'body',
        template: 'public/index.html',
        filename: isProd ? '../index.html' : 'index.html',
        scriptLoading: 'defer',
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
        ],
    },
])

const clientConfig = (env, options) => {
    return merge(baseConfig({ ...env, config: 'client' }), webpackConfig.toConfig(), {devServer: {
            host: 'localhost',
            port: process.env.PORT || 3000,
            liveReload: false,
            allowedHosts: 'all',
            devMiddleware: {
                stats: 'minimal',
            },
            static: {
                directory: path.resolve(process.cwd(), 'dist/dev'),
                publicPath: path.resolve(process.cwd()),
                watch: true,
            },
        }
    })
}

export {
    clientConfig
}
