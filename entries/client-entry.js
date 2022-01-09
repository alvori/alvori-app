import buildApp from './app.js'
import '~/assets/css/app.scss'

const { app, router } = buildApp()

router.isReady().then(() => {
    app.mount('#app')
})
