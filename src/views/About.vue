<template>
    <p>Starter tool kit SSR/PWA for Vue.js v3</p>
    <p>Enjoy development</p>
</template>

<script>
import {useMeta} from '../plugins/meta'

export default {
    name: 'About',
    setup: (props, ctx) => {
        const meta = {
            title: 'About',
            meta: {
                description: {name: 'description', content: 'About page'}
            },
            script: {
                ldJson: {
                    type: 'application/ld+json',
                    innerHTML: `{ "@context": "http://schema.orgggg" }`
                }
            },
        }
        useMeta(meta)
    }
}
</script>