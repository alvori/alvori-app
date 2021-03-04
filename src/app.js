import {
    createSSRApp,
    createApp
} from 'vue'

import App from './App.vue'
import router from './router'
import {
    meta
} from './plugins/meta'

const isSSR = typeof window === 'undefined'

export default function () {
    const app = (isSSR ? createSSRApp(App) : createApp(App))

    if (!isSSR && process.env.MODE === 'production') {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('SW registered: ', registration)
                    }).catch(registrationError => {
                        console.log('SW registration failed: ', registrationError)
                    })
            })
        }
    }

    app.use(router)
    app.use(meta)

    return {
        app,
        router,
        meta,
    }
}