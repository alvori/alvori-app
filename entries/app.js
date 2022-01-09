import { createSSRApp, createApp } from 'vue'

import App from '~/App.vue'
import router from '~/router'

export default function (ctx) {
    const isSSR = typeof window === 'undefined' || false

    const app = isSSR ? createSSRApp(App) : createApp(App)
    
    if(isSSR) {
        app.config.globalProperties.$asyncData = {}
        app.config.globalProperties.$meta = {}
    }

    if (!isSSR && process.env.PWA !== 'undefined' && process.env.MODE === 'production') {
        if ('serviceWorker' in navigator) {
            const registerSW = async () => {
                module = await import(`~/pwa/registerServiceWorker.js`)
                module = await import(`~/pwa/customServiceWorker.js`)
            }
            registerSW()
        }
    } else if (!isSSR && process.env.MODE === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister()
            })
        })
        caches.keys().then((cs) => cs.forEach((c) => caches.delete(c)))
    }

    app.use(router)

    if(__ALVORI_BOOT__.length > 0) {
        __ALVORI_BOOT__.forEach(async (entry) => {
            const entryType = typeof entry
            const registerModule = async (path) => {
                module = await import(`~/boot/${path}`)
            }
            let module
            if (entryType === 'string') {
                await registerModule(entry)
            } else if (entryType === 'object') {
                if (isSSR) {
                    entry.hasOwnProperty('server')
                        ? entry.server && (await registerModule(entry.path))
                        : await registerModule(entry.path)
                } else {
                    entry.hasOwnProperty('client')
                        ? entry.client && (await registerModule(entry.path))
                        : await registerModule(entry.path)
    
                    ctx = {
                        url: document.documentURI,
                    }
                }
            }
    
            ctx ? (ctx.url = decodeURI(ctx.url)) : void 0
    
            module &&
                module.default({
                    app,
                    router,
                    isSSR,
                    ctx,
                })
        })
    }

    return {
        app,
        router,
    }
}
