const directives = {
    focus: () => ({
        props: []
    })
}

module.exports = (ctx) => {
    return {
        boot: [
            {
                path: 'test',
            }
        ],
        chainWebpack: (webpackConfig) => {
            webpackConfig.module
                .rule('vue')
                .use('vue-loader')
                .tap(existingOptions => ({
                    ...existingOptions,
                    compilerOptions: {
                        directiveTransforms: ctx.config === 'server' ? directives : {}
                    }
                }))
        }
    }
}
