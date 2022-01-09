import buildApp from './app.js'
import '~/assets/css/app.scss'

export default async (ctx) => {
    const { router, app } = buildApp(ctx)

    await router.push(ctx.url)
    await router.isReady()

    return {
        app,
        router,
    }
}
