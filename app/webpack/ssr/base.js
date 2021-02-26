const path = require('path')
const webpack = require('webpack')
const {
    VueLoaderPlugin
} = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require("terser-webpack-plugin")
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const isProd = process.env.MODE === 'production' ? true : false
const buildMode = process.env.BUILD_MODE
const buildDir = {
    ssr: 'ssr'
}

module.exports = (env, options) => ({
    mode: process.env.MODE,
    // devtool: isProd ? false : 'source-map',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../../../src'),
            vue$: 'vue/dist/vue.runtime.esm-bundler.js'
        },
        extensions: [
            '.mjs',
            '.js',
            '.jsx',
            '.vue',
            '.json',
            '.wasm'
        ],
    },
    module: {
        noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
        rules: [{
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: {
                    envName: isProd ? 'prod' : 'dev',
                },
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 4096,
                        fallback: {
                            loader: 'file-loader',
                            options: {
                                name: process.env.CONFIG === 'client' ? 'img/[name].[ext]' : 'public/img/[name].[ext]'
                            }
                        }
                    }
                }]
            },
            {
                test: /\.(svg)(\?.*)?$/,
                use: [
                    /* config.module.rule('svg').use('file-loader') */
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'img/[name].[hash:8].[ext]'
                        }
                    }
                ]
            },
            /* config.module.rule('media') */
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                use: [
                    /* config.module.rule('media').use('url-loader') */
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 4096,
                            fallback: {
                                loader: 'file-loader',
                                options: {
                                    name: 'media/[name].[hash:8].[ext]'
                                }
                            }
                        }
                    }
                ]
            },
            /* config.module.rule('fonts') */
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
                use: [
                    /* config.module.rule('fonts').use('url-loader') */
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 4096,
                            fallback: {
                                loader: 'file-loader',
                                options: {
                                    name: 'fonts/[name].[hash:8].[ext]'
                                }
                            }
                        }
                    }
                ]
            },
        ]
    },
    optimization: {
        minimize: isProd ? true : false,
        minimizer: [
            new TerserPlugin({
                sourceMap: isProd ? false : true,
                cache: true,
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
                        evaluate: true
                    },
                    mangle: {
                        safari10: true
                    }
                },

            })
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            'process.env.MODE': JSON.stringify(process.env.MODE)
        }),
        new FriendlyErrorsWebpackPlugin(),
    ],
})