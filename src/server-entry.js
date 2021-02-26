import buildApp from './app'
import './assets/css/app.scss'

export default async context => {
    const {
        router,
        app
    } = buildApp()

    await router.push(context.url)
    await router.isReady()

    return {
        app,
        router
    }
}