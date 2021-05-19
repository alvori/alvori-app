import buildApp from './app'
import '../../src/assets/css/app.scss'

const { app, router, meta } = buildApp()

router.isReady().then(() => {
    app.mount('#app')
})
