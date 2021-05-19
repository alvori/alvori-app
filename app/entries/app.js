import { createSSRApp, createApp } from 'vue'

import App from '../../src/App.vue'
import router from '../../src/router'
import { meta } from '../../src/plugins/meta'

const isSSR = typeof window === 'undefined' || false

export default function (ctx) {
    const app = isSSR ? createSSRApp(App) : createApp(App)

    if (!isSSR && process.env.PWA && process.env.MODE === 'production') {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration)
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError)
                    })
            })
        }
    } else if (!isSSR) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister()
            })
        })
        caches.keys().then((cs) => cs.forEach((c) => caches.delete(c)))
    }

    app.use(router)
    app.use(meta)

    __ALVORI_BOOT__.forEach(async (entry) => {
        const entryType = typeof entry
        const registerModule = async (path) => {
            module = await import(`../../src/boot/${path}`)
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

    return {
        app,
        router,
        meta,
    }
}
