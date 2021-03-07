module.exports = (ctx) => {
    return {
        boot: [
            {
                path: 'test',
            },
        ],
        chainWebpack: (webpackConfig) => {
            // Example of transforming a directive for server side rendering
            // webpackConfig.module
            //     .rule('vue')
            //     .use('vue-loader')
            //     .tap(existingOptions => ({
            //         ...existingOptions,
            //         compilerOptions: {
            //             directiveTransforms: ctx.config === 'server' ? {
            //                 directiveName: () => ({
            //                     props: []
            //                 })
            //             } : {}
            //         }
            //     }))
        },
    }
}
