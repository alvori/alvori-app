import buildApp from './app'
import '@/assets/css/app.scss'

export default async (ctx) => {
    const { router, app, meta } = buildApp(ctx)

    await router.push(ctx.url)
    await router.isReady()

    return {
        app,
        router,
        meta,
    }
}
