import buildApp from './app'
import './assets/css/app.scss'

const { app, router, meta } = buildApp()

router.isReady().then(() => {
    app.mount('#app')
})
