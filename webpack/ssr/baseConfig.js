import path from 'path'
import webpack from 'webpack'
import { VueLoaderPlugin } from 'vue-loader'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import fs from 'fs'
import url from 'url'

import Chain from 'webpack-chain'


const loadExtendConfig = async () => {
    return await import(url.pathToFileURL(path.join(process.cwd(), 'alvori.config.js')))
}

let extendConfig = null
if(fs.existsSync(path.resolve(process.cwd(), 'alvori.config.js'))) {
    extendConfig = await loadExtendConfig()
}

const isProd = process.env.MODE === 'production' ? true : false
const webpackConfig = new Chain()

webpackConfig.mode(process.env.MODE)

webpackConfig.resolve.alias
    .set('~', path.resolve(process.cwd(), 'src'))
    .set('vue$', 'vue/dist/vue.runtime.esm-bundler.js')

webpackConfig.resolve.extensions.add('.mjs').add('.js').add('.jsx').add('.vue').add('.json').add('.wasm')

webpackConfig.module.noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/)

webpackConfig.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader('vue-loader')

webpackConfig.module
    .rule('scss')
    .test(/\.(sa|sc|c)ss$/)
    .exclude.add(/(node_modules|bower_components)/)
    .end()
    .use('miniCssExtractPluginLoader')
    .loader(MiniCssExtractPlugin.loader)
    .end()
    .use('css')
    .loader('css-loader')
    .end()
    .use('postcss')
    .loader('postcss-loader')
    .end()
    .use('sass')
    .loader('sass-loader')
    .end()

webpackConfig.module
    .rule('images')
    .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
    .use('url-loader')
    .loader('url-loader')
    .options({
        limit: 4096,
        fallback: {
            loader: 'file-loader',
            options: {
                name: process.env.CONFIG === 'client' ? 'img/[name].[ext]' : 'public/img/[name].[ext]',
            },
        },
    })

webpackConfig.module
    .rule('svg')
    .test(/\.(svg)(\?.*)?$/)
    .use('svg')
    .loader('file-loader')
    .options({
        name: 'img/[name].[hash:8].[ext]',
    })

webpackConfig.module
    .rule('media')
    .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
    .use('media')
    .loader('file-loader')
    .options({
        limit: 4096,
        fallback: {
            loader: 'file-loader',
            options: {
                name: 'media/[name].[hash:8].[ext]',
            },
        },
    })

webpackConfig.module
    .rule('fonts')
    .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
    .use('fonts')
    .loader('vue-loader')
    .options({
        limit: 4096,
        fallback: {
            loader: 'file-loader',
            options: {
                name: 'fonts/[name].[hash:8].[ext]',
            },
        },
    })

webpackConfig.optimization
    .minimize(isProd ? true : false)
    .minimizer('terser')
    .use(TerserPlugin, [
        {
            // sourceMap: isProd ? false : true,
            // cache: true,
            parallel: true,
            extractComments: false,
            terserOptions: {
                compress: {
                    arrows: false,
                    collapse_vars: false,
                    comparisons: false,
                    computed_props: false,
                    hoist_funs: false,
                    hoist_props: false,
                    hoist_vars: false,
                    inline: false,
                    loops: false,
                    negate_iife: false,
                    properties: false,
                    reduce_funcs: false,
                    reduce_vars: false,
                    switches: false,
                    toplevel: false,
                    typeofs: false,
                    booleans: true,
                    if_return: true,
                    sequences: true,
                    unused: true,
                    conditionals: true,
                    dead_code: true,
                    evaluate: true,
                },
                mangle: {
                    safari10: true,
                },
            },
        },
    ])

webpackConfig.plugin('vue').use(VueLoaderPlugin)
webpackConfig.plugin('define').use(webpack.DefinePlugin, [
    {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        'process.env.MODE': JSON.stringify(process.env.MODE),
    },
])

const baseConfig = (env, options) => {
    const alvoriConfig = extendConfig.default(env)

    webpackConfig.plugin('define').use(webpack.DefinePlugin, [
        {
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            'process.env.MODE': JSON.stringify(process.env.MODE),
            'process.env.PWA': JSON.stringify(process.env.PWA),
            __ALVORI_BOOT__: typeof alvoriConfig !== 'undefined' ? JSON.stringify(alvoriConfig.boot) : [],
        },
    ])

    return webpackConfig.toConfig(env, options)
}

export {
    baseConfig
}
